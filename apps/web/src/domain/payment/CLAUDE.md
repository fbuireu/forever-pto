# apps/web/src/domain/payment

## Purpose

What happens to a Donation once Stripe has decided. Two domain events, a factory that builds them out of a
Stripe `PaymentIntent`, and two handlers that reconcile the payments table with them. Server-only, and the
one place in `src/domain/` that composes Effect against infrastructure, deliberately and not by accident
([ADR 0003](../../../../../adr/0003-pure-calendar-domain-effectful-payment-domain.md)). The layer contract is
in [`../CLAUDE.md`](../CLAUDE.md).

There is no accounts table: a payment row with status `succeeded` *is* Premium
([ADR 0008](../../../../../adr/0008-premium-derived-from-payment.md)). Everything here is ultimately about
keeping that row honest.

## Files

| File | Contents |
| --- | --- |
| [`events/types.ts`](./events/types.ts) | `PaymentSucceededEvent` and `PaymentFailedEvent` (plain interfaces, no Stripe types), plus the `PaymentStatus` union and the `PAYMENT_SUCCEEDED` constant |
| [`events/factory/events.ts`](./events/factory/events.ts) | `createPaymentSucceededEvent` (an Effect, it can fail), `createPaymentFailedEvent`: the only place a `Stripe.PaymentIntent` is read |
| [`events/factory/resolvers.ts`](./events/factory/resolvers.ts) | `resolveChargeId` flattens `latest_charge`, which Stripe returns as an id, an expanded object or nothing |
| [`handlers/paymentSucceeded.ts`](./handlers/paymentSucceeded.ts) | `handlePaymentSucceeded`: status reconciliation plus best-effort charge enrichment |
| [`handlers/paymentFailed.ts`](./handlers/paymentFailed.ts) | `handlePaymentFailed`: status reconciliation, with `succeeded` treated as terminal |

## Public API

Both handlers return an Effect and neither runs itself. The requirement channels differ, and the difference
is the useful part:

```typescript
handlePaymentSucceeded(event): Effect<void, DatabaseError, TursoService | StripeServerService | LoggerService>
handlePaymentFailed(event):    Effect<void, DatabaseError, TursoService | LoggerService>
```

`handlePaymentSucceeded` needs Stripe because it goes back for the charge; `handlePaymentFailed` does not.
The only caller is `processWebhookEvent`, in [`webhook.ts`](../../application/use-cases/webhook.ts) under `@application/use-cases`, which builds the
event through the factory; the layer is provided at the route.

## Stripe stops at the factory

`Stripe` appears in this folder twice, in `events/factory/events.ts` and `events/factory/resolvers.ts`, and
both are `import type`, so no SDK is constructed and nothing here pulls the Stripe runtime in behind it. The
handlers see only the event interfaces.

Two things the factory settles that everything downstream then assumes:

- **`amount` stays in Stripe's minor units.** It is copied straight from `paymentIntent.amount` and written
  to the payments table unchanged. Only `paymentConfirmationDTO`, which feeds a screen, divides by 100.
- **`email` must resolve, or the event is not built at all.** `createPaymentSucceededEvent` is therefore the
  only factory here returning an Effect: `Effect<PaymentSucceededEvent, MissingDonorEmailError>`. It takes the
  first non-blank of `metadata.email` and `receipt_email`, trimmed, and fails with `MissingDonorEmailError`
  when neither yields one. Trimming is the point: `metadata` is `{ [k: string]: string }` with no
  `noUncheckedIndexedAccess`, so `??` alone would happily accept the empty string Stripe allows. A blank email
  used to be persisted as the payments row's key, and since Premium is keyed by that address
  ([ADR 0008](../../../../../adr/0008-premium-derived-from-payment.md)) the payer could never be found again by
  the "I already donated" path. The failure is caught in `webhook.ts`, not here; see below.

Both factories are annotated with the interface they produce (`createPaymentSucceededEvent` through the
success channel of its Effect), so a field dropped from `events/types.ts`, or one the factory forgets to set,
is a compile error in `events/factory/events.ts` itself rather than at the call site in another layer. Keep
the annotations when adding a field.

## The entitlement value is typed where it can be proved, and named where it cannot

`PaymentStatus` restates Stripe's seven `PaymentIntent.Status` members by hand. It is not imported from the
SDK, because this folder keeps Stripe at the factory. The factory assigns `paymentIntent.status` into it, so
a member Stripe adds is a compile error there, at the one place that translates Stripe into the domain, and
nowhere else.

It types the two events' `status`, and `updatePaymentStatus`'s parameter, a function that used to take
`(paymentIntentId: string, status: string)`, where swapping the two arguments compiled. Every caller passes
either a literal from this codebase or an event's status, so the union is true at all three.

**`PaymentData.status` deliberately stays `string`, and the union would be a lie there.** It has two
producers: `paymentDataDTO`, which reads a `Stripe.PaymentIntent`, and `toPaymentData` in
[`@infrastructure/services/payments/repository`](../../infrastructure/services/payments/CLAUDE.md), which
reads a SQLite `TEXT` column. Nothing constrains what that column holds, since an older deploy or a manual fix could have written it, so
narrowing the field would need an `as` at the read, which buys a claim the code cannot check in exchange for
nothing: no consumer switches on the status, they all test it against one value.

That is what `PAYMENT_SUCCEEDED` is for. It is redundant where the union already applies, and it is the only
check available at the four sites that compare a `PaymentData.status`: `activatePremium` twice, and both
handlers. `PaymentConfirmationDTO.status` is narrowed instead of named, since its single producer is the
Stripe read.

**Three copies of the literal remain, all inside SQL, and none of them can take the constant.**
`repository.ts` spells `'succeeded'` in the `succeeded_at` `CASE`, in `getSucceededPaymentByEmail`'s `WHERE` and in
`countPromoCodeRedemptions`'. Interpolating a TypeScript value into a query string to remove them would
trade a checkable drift for something that reads as injection. `repository.test.ts` ties the first to the
constant by assertion instead; the other two are covered by their own query assertions.

## Invariants and traps

**Stripe redelivers, and does not guarantee order.** Both handlers are written to be replayed. A failure
event can arrive after the retry has already succeeded, and that row is the entitlement, so it must not be
overwritten, but **the rule lives in the `WHERE` clause now, not in either handler**.
`updatePaymentStatus` carries `AND status != 'succeeded'` and answers whether it wrote, so
`handlePaymentFailed` calls it and warns when nothing was touched instead of reading the row first. That
read never guarded anything: `TursoService` opens a connection per call, so a redelivery racing the original
could have both reads see `processing`. See
[`../../infrastructure/services/payments/CLAUDE.md`](../../infrastructure/services/payments/CLAUDE.md).

`handlePaymentSucceeded` still reads, and that is deliberate: 0 rows affected cannot distinguish "already
succeeded" from "no such row", and this handler owes a different answer to each: a missing row warns and
skips the charge enrichment.

**A Donation with no email is dropped, loudly, by the caller.** `processWebhookEvent` catches
`MissingDonorEmailError`, logs it through `logger.logError` and returns without touching the payments table,
so Stripe gets its 2xx. That is deliberate: the condition is permanent, and a 500 would have Stripe redeliver
an event that can never succeed. The log line is the only signal, which is why it is at error level.

**A missing payment row is not this folder's problem.** `handlePaymentSucceeded` logs a warning and returns
when `getPaymentById` finds nothing. Creating the row from the webhook happens *before* the handler is
called, in `webhook.ts`, because it needs `paymentDataDTO` from the application layer and the raw
`PaymentIntent` the handler no longer has. Do not move that fallback in here to make the handler
self-sufficient.

**Charge enrichment must never fail the webhook.** `updateCharge` fetches the charge from Stripe and writes
receipt URL, card brand, fees and address onto the row. It is typed `Effect<void, never, …>` and ends in
`Effect.catchAll(() => Effect.void)`: a Stripe outage or a failed write costs some reporting detail, not
the payment record. It also returns `Effect.void` immediately when `latestChargeId` is null.

**Genuine failures must keep propagating.** `updatePaymentStatus` is *not* caught. A database failure
surfaces as `DatabaseError`, the route answers 500, and Stripe redelivers. Swallowing it drops the event
permanently and the user keeps their Donation without Premium.

**Reads that only guard an idempotency check are absorbed.** Both handlers wrap `getPaymentById` in
`Effect.catchAll(() => Effect.succeed(undefined))`, so an unreadable row is treated as an absent one. That
is the reason a read failure and a genuinely missing payment are indistinguishable in the logs.

**Error-path logs go in `Effect.sync` inside `tapError`; the two guard-path logs do not.** The wrapper is
about *when* the line runs, not about safety: `tapError` fires only on the failure it is attached to, and each
one must sit on the step it names. In `updateCharge` the retrieval log is piped directly onto
`retrieveCharge`, before the `Effect.flatMap`, because on the composed pipeline it would also fire for a
failed write and log it a second time as a retrieval failure that never happened. The two early-return
warnings (`handlePaymentSucceeded` on a missing row, `handlePaymentFailed` on an already-succeeded one) are
bare statements in the generator body, because there is no failure to tap: the condition is a successful
read. That is safe only because `BetterStackClient` cannot throw; see
[`../../infrastructure/clients/CLAUDE.md`](../../infrastructure/clients/CLAUDE.md). `Effect.sync` would not
buy safety anyway; a throw inside it is a defect just the same.

## Out of scope

| Concern | Where it lives |
| --- | --- |
| Webhook signature verification and event dispatch | the route handler under `src/app/api/`, then `webhook.ts` |
| Creating a missing payment row from the webhook | `webhook.ts` |
| Granting Premium and minting the session | `activatePremium.ts` and `@infrastructure/services/premium` |
| Creating the intent, promo codes, rate limiting | `@infrastructure/services/payments` |
| Anything the payer sees | `@ui/adapters/payments` and the payment pages |

## Testing

`events.ts`, `paymentSucceeded.ts` and `paymentFailed.ts` each have a co-located `.test.ts`;
`events/types.ts` has none and should not grow one. `resolvers.ts` is covered through [`events.test.ts`](./events/factory/events.test.ts).

The factory needs no layer, because it requires nothing, so `events.test.ts` drives it with `Effect.runSync`, and
`Effect.runSync(… .pipe(Effect.flip))` where the assertion is about `MissingDonorEmailError`.

Handler tests build a `Layer.succeed(Tag, mock)` for every tag in the requirement channel and run the
program over it, and no Stripe or Turso client is ever constructed.
 The repository and provider modules are
`vi.mock`-ed to return `Effect.succeed(...)`, and the assertions worth copying are the negative ones:
that `updatePaymentStatus` was *not* called for an already-succeeded payment, and that a failing charge
retrieval leaves the handler's success channel intact.

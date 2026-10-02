# apps/web/src/domain/payment

## Purpose

What happens to a Donation once Stripe has decided. The domain events, a factory that builds them out of a
Stripe `PaymentIntent`, and the handlers that reconcile the payments table with them. Server-only, and the
one place in `src/domain/` that composes Effect against infrastructure, deliberately, not by accident
([ADR 0003](../../../../../adr/0003-pure-calendar-domain-effectful-payment-domain.md)). The layer contract is
in [`../AGENTS.md`](../AGENTS.md).

There is no accounts table: a payment row with status `succeeded` *is* Premium
([ADR 0008](../../../../../adr/0008-premium-derived-from-payment.md)). Everything here is ultimately about
keeping that row honest.

## Files

| File | Contents |
| --- | --- |
| [`events/types.ts`](./events/types.ts) | `PaymentSucceededEvent` and `PaymentFailedEvent` (plain interfaces, no Stripe types) plus `PAYMENT_STATUSES`, the `PaymentStatus` union derived from it, the widened `ReportedPaymentStatus` that the events actually carry, and the `PAYMENT_SUCCEEDED` constant |
| [`events/factory/events.ts`](./events/factory/events.ts) | `createPaymentSucceededEvent` (an Effect, it can fail), `createPaymentFailedEvent`, the only place a `Stripe.PaymentIntent` is read |
| [`events/factory/resolvers.ts`](./events/factory/resolvers.ts) | `resolveChargeId`: flattens `latest_charge`, which Stripe returns as an id, an expanded object or nothing |
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

`Stripe` appears in this folder only under `events/factory/` (the factory, its resolver and the factory's test),
always as `import type`; no SDK is constructed, so nothing here pulls the Stripe runtime in behind it. The
handlers see only the event interfaces.

**`email` must resolve, or the event is not built at all.** `createPaymentSucceededEvent` is therefore the
only factory here returning an Effect: `Effect<PaymentSucceededEvent, MissingDonorEmailError>`. It reads the
address through `readDonationMetadata`, which takes the first non-blank of `metadata.email` and `receipt_email`,
trimmed, and fails with `MissingDonorEmailError` when neither yields one. Trimming is the point: `metadata` is
`{ [k: string]: string }` with no `noUncheckedIndexedAccess`, so `??` alone would happily accept the empty string
Stripe allows. A blank email would become the payments row's key, and since Premium is keyed by that address
([ADR 0008](../../../../../adr/0008-premium-derived-from-payment.md)) the payer could never be found again by
the "I already donated" path. The failure is caught in `webhook.ts`, not here; see below.

Both factories are annotated with the interface they produce (`createPaymentSucceededEvent` through the
success channel of its Effect), so a field dropped from `events/types.ts` (or one the factory forgets to set)
is a compile error in `events/factory/events.ts` itself rather than at the call site in another layer.

## An event carries what a handler acts on, not a copy of the intent

`PaymentSucceededEvent` is `paymentId`, `email`, `status` and `latestChargeId`. `handlePaymentSucceeded` reads
all but `email`, which `processWebhookEvent` reads to write the row: `email` stays because the factory's
`MissingDonorEmailError` guard is what proves it resolved, and a caller must not have to re-derive that.

Everything else the intent holds stays with the intent. `processWebhookEvent` passes the intent itself to
`paymentDataDTO.create` as `raw`, which reads `raw.amount` and keeps Stripe's minor units, and reads the promo
code, the user agent and the IP address through `readDonationMetadata` beside it. No event carries a `type`
either: `processWebhookEvent` switches on Stripe's own discriminated union and calls one handler per branch.

`PaymentFailedEvent.errorMessage` exists for the log: `handlePaymentFailed`'s warn carries it as `reason`, and
that line is its only reader.

## The entitlement value is typed where it can be proved, and named where it cannot

`PAYMENT_STATUSES` restates Stripe's `PaymentIntent.Status` members by hand, and `PaymentStatus` is derived
from it: the list is not imported from the SDK, because this folder keeps Stripe at the factory. It is the
set of statuses **this product reasons about**, which is not the same claim as the set Stripe can send.

**Stripe's enums are open, so what an event carries is `ReportedPaymentStatus`, not `PaymentStatus`.** Stripe
adds members to an enum on an API version already pinned, and the SDK's types say so: `PaymentIntent.Status`
ends in its `OtherString` marker. `ReportedPaymentStatus` is the union widened the same way, so a status this
product has never modelled reaches the database exactly as Stripe sent it rather than being dropped, renamed to
a sentinel, or turned into a failed webhook that Stripe then retries forever. Every consumer asks *is it
succeeded* and never *which of the seven is it*, so none of them needs the closed union to be correct.

`tests/docs-consistency.test.ts` compares `PAYMENT_STATUSES` against the `type Status` union the installed SDK
publishes, so a member Stripe adds fails the suite whether or not any code assigns it. `updatePaymentStatus`'s
`status` takes the same widened type.

**`PaymentData.status` deliberately stays `string`, and the union would be a lie there.** Its
producers are: `paymentDataDTO`, which reads a `Stripe.PaymentIntent`, and `toPaymentData` in
[`@infrastructure/services/payments/repository`](../../infrastructure/services/payments/AGENTS.md), which
reads a SQLite `TEXT` column. Nothing constrains what that column holds (an older deploy, a manual fix), so
narrowing the field would need an `as` at the read, which buys a claim the code cannot check in exchange for
nothing: no consumer switches on the status, they all test it against one value.

That is what `PAYMENT_SUCCEEDED` is for. It is redundant where the union already applies, and it is the
spelling to reach for wherever a `PaymentData.status` meets the entitlement value. **No handler compares
against it**: the `WHERE` clause owns that rule, see below. Its readers are all outside this folder,
`activatePremium`'s guard on a raw `Stripe.PaymentIntent.status` among them, and the contract suite lets no
production module spell the literal instead, the repository's SQL and two modules that use the word for something
else aside.

**`PaymentConfirmationDTO.status` is widened like the events, and the page does not read it.** Which
statuses mean *charged* is a business rule, and `app` never imports `domain`, so
[`@application/dto/payment/dto`](../../application/dto/payment/dto.ts) owns it: `hasSucceeded` and
`wasCharged` are what the confirmation page calls, and the set of not-charged statuses lives beside them.

**Copies of the literal remain, all inside SQL, and none of them can take the constant.**
`repository.ts` spells `'succeeded'` in the `succeeded_at` `CASE`, in `updatePaymentStatus`'s guard, in
`getSucceededPaymentByEmail`'s `WHERE` and in `countPromoCodeRedemptions`'. Interpolating a TypeScript value into
a query string to remove them would trade a checkable drift for something that reads as injection.
`tests/docs-consistency.test.ts` ties every status comparison in that file to `PAYMENT_SUCCEEDED` instead, and
`repository.test.ts` asserts the `CASE`.

## Invariants and traps

**Stripe redelivers, and does not guarantee order.** Both handlers are written to be replayed. A failure
event can arrive after the retry has already succeeded, and that row is the entitlement, so it must not be
overwritten, but **the rule lives in the `WHERE` clause, not in either handler**.
`updatePaymentStatus` carries `AND status != 'succeeded'` and answers whether it wrote, so
`handlePaymentFailed` calls it and warns when nothing was touched instead of reading the row first. A read
guards nothing here: `TursoService` opens a connection per call, so a redelivery racing the original can have
both reads see `processing`. See
[`../../infrastructure/services/payments/AGENTS.md`](../../infrastructure/services/payments/AGENTS.md).

**Neither handler reads before it writes.** `processWebhookEvent` runs `savePayment`, an `INSERT OR IGNORE`,
immediately before calling `handlePaymentSucceeded`, so the row exists by then, and the only way a read could
answer "no such row" is by failing. An absorbed read failure looks exactly like a payment that was never created:
the handler returns, the route answers 200, Stripe never redelivers, and by
[ADR 0008](../../../../../adr/0008-premium-derived-from-payment.md) that donor's recovery path is dead for good.

`updatePaymentStatus` answers the same question in one fewer round trip and cannot lie about it. Its `WHERE`
is `id = ? AND status != 'succeeded'` and it returns whether it wrote, so `false` means "absent or already
succeeded" and a `DatabaseError` propagates as "we could not tell". Both handlers branch on that one boolean,
and the branches are not distinguished and do not need to be. `updatePaymentCharge`'s own
`WHERE id = ?` touches nothing when the row is absent, and a redelivery landing on an already-succeeded row
is exactly when charge enrichment is worth retrying. Both handler suites pin that `getPaymentById` is never
called; that case goes red the moment the read comes back.

**A Donation with no email is dropped, loudly, by the caller.** `processWebhookEvent` catches
`MissingDonorEmailError`, logs it through `logger.logError` and returns without touching the payments table,
so Stripe gets its 2xx. That is deliberate: the condition is permanent, and a 500 would have Stripe redeliver
an event that can never succeed. The log line is the only signal, which is why it is at error level.

**A missing payment row is not this folder's problem.** Creating the row from the webhook happens *before*
`handlePaymentSucceeded` is called, in `webhook.ts`, because it needs `paymentDataDTO` from the application layer
and the raw `PaymentIntent` the handlers do not have. The failed path creates no row, so on an absent row
`handlePaymentFailed`'s write touches nothing and it warns. Do not move that fallback in here to make a handler
self-sufficient, and do not add a read to tell a missing row from an already-succeeded one: the write already
reports that it touched nothing, and a read cannot report why.

**Charge enrichment must never fail the webhook.** `updateCharge` fetches the charge from Stripe and writes
receipt URL, card brand, fees and address onto the row. It is typed `Effect<void, never, …>` and ends in
`Effect.catchAll(() => Effect.void)`: a Stripe outage or a failed write costs some reporting detail, not
the payment record. It also returns `Effect.void` immediately when `latestChargeId` is null.

**Genuine failures must keep propagating.** `updatePaymentStatus` is *not* caught. A database failure
surfaces as `DatabaseError`, the route answers 500, and Stripe redelivers. Swallowing it drops the event
permanently and the user keeps their Donation without Premium.

**Nothing in here absorbs a database failure.** There is no `Effect.catchAll` over a repository call in either
handler, and adding one re-creates the defect above: an absorbed read failure is indistinguishable from a row
that is not there, and the difference decides whether Stripe redelivers. `updateCharge` is the single exception
and is not a repository guard; see *Charge enrichment* above.

**The retrieval log in `updateCharge` is piped directly onto `retrieveCharge`, before the `Effect.flatMap`**:
on the composed pipeline its `tapError` would also fire for a failed write and log it a second time as a retrieval
failure that never happened. The early-return warnings (in both handlers, on a write that touched no row) are bare
statements in the generator body, because the condition is a successful write, and `logger` cannot throw; see
[`../../infrastructure/AGENTS.md`](../../infrastructure/AGENTS.md).

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
`events/types.ts` has none. `resolvers.ts` is covered through [`events.test.ts`](./events/factory/events.test.ts).

The factory needs no layer (it requires nothing), so `events.test.ts` drives it with `Effect.runSync`, and
`Effect.runSync(… .pipe(Effect.flip))` where the assertion is about `MissingDonorEmailError`.

Handler tests build a `Layer.succeed(Tag, mock)` for every tag in the requirement channel and run the program
over it, with the repository and provider modules `vi.mock`-ed to return `Effect.succeed(...)`. They pin the
negative cases: a failing charge retrieval leaves the handler's success channel intact, and `handlePaymentFailed`
does *not* warn when the write reports it touched a row.

`updatePaymentStatus` is `Effect<boolean, DatabaseError, TursoService>` and `handlePaymentFailed` branches on the
value, so its default double succeeds with `true`: a falsy default would send every case down the "nothing was
written" branch, and a case that mocks `false` would pass with the branch deleted. A failing double fails with the
error the real function declares (`retrieveCharge` with `PaymentError`, the repository with `DatabaseError`).

Both handler suites assert `getPaymentById` is never reached; its entry in their `vi.mock` factories exists only so
that assertion has something to be about, and a `mockReturnValueOnce` on it is a no-op.

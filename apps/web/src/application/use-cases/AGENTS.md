# apps/web/src/application/use-cases

## Purpose

The server-side flows that combine more than one external service: taking a Donation, activating
Premium, handling the Stripe webhook, and sending a contact message. A use-case is an Effect *program*: a
value, not a call. It composes service tags and repository functions, declares what it can fail with, and
returns.

## Files

| File | Exports | Combines |
| --- | --- | --- |
| [`payment.ts`](./payment.ts) | `createPayment` | promo-code validation, Stripe intent creation, deferred persistence |
| [`activatePremium.ts`](./activatePremium.ts) | `activateWithPayment`, `activateWithClaimedPayment`, `activateWithEmail` | Stripe intent lookup, payment repository, session minting |
| [`webhook.ts`](./webhook.ts) | `processWebhookEvent` | payment repository, the `@domain/payment` event factory and handlers |
| [`contact.ts`](./contact.ts) | `sendContactEmail` | Zod validation, the contact guard's lookups, React Email render, Resend, deferred persistence |

## The entry-point convention

Every export is `(input) => Effect.Effect<A, E, R>`. `activateWithPayment` and `activateWithClaimedPayment` write
it through the `DonationActivation` alias and delegate to the private `activateFromDonation`, which is the
`Effect.gen`. That signature is the contract:

- **`R`** lists the service tags the caller must provide: `StripeServerService`, `TursoService`,
  `ResendService`, `LoggerService`. Tags are `yield*`-ed out of context; no client is ever constructed here.
- **`E`** lists the tagged errors from `errors.ts` the caller has to map. The operations map them with
  `describeFailure` in `@infrastructure/api/errors`, a table keyed on `_tag` whose parameter is the
  `TaggedFailure` union, so a failure mode added to `E` and missing there is a type error instead of a silent
  500 ([ADR 0002](../../../../../adr/0002-effect-for-external-service-boundaries.md)). The Stripe webhook
  route is the exception: it answers 500 for anything but a `WebhookError`, which is what makes Stripe
  redeliver.
- Success values are plain objects. Nothing here builds a `NextResponse`.
- **Every export ends in `Effect.withSpan` named after itself**, which adds nothing to `R` and which nothing
  consumes: `ApplicationLayer` provides no `Tracer`. The span a trace shows is the platform's, which the entry point
  opens around the whole run with `traced` from `@infrastructure/span` under the use case's name; see
  [`../../infrastructure/AGENTS.md`](../../infrastructure/AGENTS.md) and
  [ADR 0017](../../../../../adr/0017-observability-is-the-platform-export.md).

A deferred write that has no response left to fail and a charge lookup that only adds reporting detail are absorbed
in place rather than widening `E`; a database failure on the critical path propagates (see
[`../../domain/payment/AGENTS.md`](../../domain/payment/AGENTS.md)). The logs sit where the failure is handled: in
`tapError` (`webhook.ts`, `payment.ts`, `activatePremium.ts`), in a `catchAll` that absorbs it (`payment.ts`,
`contact.ts`, `activatePremium.ts`) or in the `catch` of `Effect.tryPromise` (`contact.ts`'s render); `logger` cannot
throw, so none of them needs a guard (see [`../../infrastructure/AGENTS.md`](../../infrastructure/AGENTS.md)).

## Termination is the caller's job, not ours

Nothing in this folder calls `Effect.runPromise` or provides a layer. The operations under
`@infrastructure/api/operations` (`createPaymentRequest`, `sendContactRequest`, `activatePremiumRequest`) and
the Stripe webhook route run each program: they pipe it through `Effect.provide(ApplicationLayer)`
([`layers.ts`](../../infrastructure/layers.ts)), map the typed errors to a status, add a `catchAll` fallback
for the untyped remainder, and run it. Forgetting the layer is a compile error, not a runtime one.

A route handler and a server action that expose the same operation call the same function in
`@infrastructure/api/operations`: `/api/payment` and `createPaymentAction` both go through
`createPaymentRequest`, which rate-limits before `createPayment` runs, and `/api/contact` and
`sendContactEmailAction` both go through `sendContactRequest`. Behaving identically is structural there, not
something to keep in step.

## Configuration arrives as plain values

The Cloudflare context is only valid inside a request, and a use-case is a value that may be run later, including
from inside `after()`, after the response has been sent
([ADR 0004](../../../../../adr/0004-cloudflare-workers-as-deployment-target.md)). So the caller reads the context
and passes what it found down as an ordinary object: `sendContactEmail` takes `{ siteUrl, contactEmail }`,
`createPayment` takes `{ userAgent, ipAddress }`.

## The deferred effect

Most of the use-cases return a `deferred: Effect.Effect<void, never, TursoService>` alongside their
result. It holds the database writes that the user's response does not depend on; the caller schedules it
with `after(() => Effect.runPromise(deferred.pipe(Effect.provide(ApplicationLayer))))`. The layer has to be
provided a second time: the outer program's runtime is gone by then.

- **`never` in the error channel.** Every failure inside is caught and logged, because there is no longer a
  response to fail. A lost write is invisible outside the logs, which is why `processWebhookEvent` re-creates
  a missing payment row: the webhook is the backstop for a deferred write that did not land.
- **`TursoService` alone in `R`.** The logger is resolved in the outer `Effect.gen` and captured by the
  closure, so the deferred does not require `LoggerService` even though it logs.

`activateWithEmail` returns `Effect.void` as its deferred (the recovery path has nothing to persist), so the
caller can treat them all uniformly.

## Premium activation

`activatePremium.ts` is the code behind [ADR 0008](../../../../../adr/0008-premium-derived-from-payment.md):
there is no accounts table, so a succeeded payment record *is* the entitlement, and every export ends by
minting the same 30-day session token via `createSession` in [`session.ts`](../../infrastructure/services/premium/session.ts).

The paths are deliberately asymmetric, and this is the trap:

- `activateWithPayment` and `activateWithClaimedPayment` (straight after a Donation) **verify**. Both are
  thin entry points over one private `activateFromDonation`, which retrieves the payment intent from Stripe,
  rejects anything not `succeeded`, and takes the payer's address from `metadata.email` or `receipt_email`.
  An intent carrying neither was not created by the Donation flow and cannot prove the caller owns it, so it
  is refused rather than trusted. **The extra check each entry point adds is a required parameter of that
  entry point, not an optional one on a shared function**: `activateWithPayment({ paymentIntentId,
  clientSecret })` for `GET /api/payment/activate`, which holds the secret Stripe appended to the
  `return_url`; `activateWithClaimedPayment({ paymentIntentId, expectedEmail })` for `POST
  /api/check-session`, which holds an email the browser typed. The secret is the stronger of them, since
  only someone who completed the payment has it. Inside `activateFromDonation` both are optional, so a third
  caller of it would skip whichever guard it omits. Deriving the email from the intent is
  what lets the redirect path activate at all, since the payer may come back in a browser that never held
  their address. See [`../../app/AGENTS.md`](../../app/AGENTS.md).
- `activateWithEmail` (the "I already donated" recovery path) **does not verify**. It looks up a succeeded
  payment by email and grants access. That is accepted, not overlooked; do not "fix" it in passing.

The critical path never writes to the database. Reading the intent and minting the token are the only steps
that must succeed; creating or repairing the payment row happens in the deferred. `activateWithPayment`
therefore does not require `TursoService` at all: that requirement lives only on its deferred.

`ValidationError` is the only failure the boundary turns into a 400 here, and its `message` is returned to
the client verbatim.

**That is why the Stripe read is not relabelled.** A failed `stripe.paymentIntents.retrieve` (an outage, a
bad key) is a `PaymentError`, mapped to 500 `INTERNAL_ERROR`. Relabelled as `ValidationError`, it would reach
the payer on the post-charge path: `confirmPayment` POSTs to `/api/check-session` immediately after the card
clears, and on a non-ok response the checkout adapter returns `FAILED_AFTER_CHARGE` carrying the body's
`error`, once `activationFailureSchema` accepts the body, which `resolveApiErrorMessage` renders as prose. The payer would read Stripe's own text
(`No such payment_intent: 'pi_3ABC…'`) under a 400 telling every layer above that there was nothing to retry.
`PaymentError` travels in `activateWithPayment`'s error channel and `check-session` maps it beside
`SessionError` and `DatabaseError`. `ValidationError` is reserved for the conditions this file decides for
itself: secret mismatch, not succeeded, email mismatch, no payment found.

## The contact guard runs before the send, and it is not an IP rate limit

`sendContactEmail` refuses in a couple of cases before it renders or sends anything, so a refusal costs no Resend
call and no `contacts` row:

- **A cooldown.** The same sender wrote inside the last `CONTACT_COOLDOWN_HOURS`.
- **A repeat.** The same sender sent this exact message before, whatever the window says.

**One conditional statement holds both, so two submissions at the same moment send one email.**
`reserveContactSlot` inserts the sender's row only when no row for that sender exists since the window's start
and none carries the same message, and the email goes out only when the insert took. A read followed by an
insert lets two requests both read nothing and both send ([`CODING_STANDARDS.md`](../../../../../CODING_STANDARDS.md)
`D9`). When the insert does not take, `findContactWithMessage` names the `reason`, `repeated` before `cooldown`.
The guard needs no new binding and no new store, and it is keyed on `contactSenderKey`, which strips a `+alias`;
see [`../dto/AGENTS.md`](../dto/AGENTS.md) for why that normaliser is separate from the payments one.

- **The window is compared as an instant.** `created_date` holds SQLite's `datetime('now')` text and the
  window's start arrives as an ISO string, so the statement reads `created_date >= datetime(?)`: compared as
  text, the space and the `T` would drop every row from the previous UTC day.
- **A failed email frees the slot.** If the render or the send fails, the reserved row is deleted so the sender
  can try again, and the release is logged at `warn` with the email's failure, or at `error` when the delete
  fails too and the slot stays held for the window. The answer is the `EmailError` either way.
- **The deferred write records the message id.** The row exists from the reservation on; `after()` sets
  Resend's `messageId` on it, and a failure there only logs.
- **The cost is a slot held with nothing sent** when the Worker dies between the reservation and the send: the
  sender is refused for the window. Holding the slot after the send instead would let the same crash send twice.

**Why not `checkRateLimit`.** The platform limiter keys on the IP, which is the right shape for the card
processor in front of `POST /api/payment`: there the attacker is anonymous and the cost is Stripe's. Here
the sender identifies themselves, the cost is an email in the operator's inbox and a row, and an IP limit
would punish everyone behind one office NAT while letting a mobile connection through on every reconnect.
The cooldown is keyed on the thing the product actually has.

**The refusal answers 429 with `contact_already_received`.** `DuplicateContactError` is a tagged failure with
a `reason` of `cooldown` or `repeated`, and `describeFailure` maps it, so both transports (the route handler
and the server action) report it the same way without either deciding the policy.

## Webhook

`processWebhookEvent` receives an already-verified `Stripe.Event`: signature checking happens at the route,
because it needs the raw body and the signature header. The use-case switches on `event.type`, builds a
domain event through the `@domain/payment` factory, and delegates to `handlePaymentSucceeded` /
`handlePaymentFailed`.

**The `switch` is the narrowing, and nothing re-asserts the payload type.** `Stripe.Event` is a discriminated
union, so inside `case "payment_intent.succeeded"` the compiler already knows `event.data.object` is a
`Stripe.PaymentIntent`. A cast there would let a case relabelled to `charge.succeeded` compile and hand a
`Stripe.Charge` to `paymentDataDTO.create` and into the payments row. The test's event helpers are per-member
(`succeededEvent`, `failedEvent`, `unhandledEvent`) and take a `Partial<Stripe.PaymentIntent>`, so the test
cannot launder the same misreading. Unknown types are logged and ignored, never rejected: Stripe sends event
types nobody subscribed to and a non-2xx would put them into retry.

A `handlePaymentSucceeded` error is logged *and* propagates as
`DatabaseError`, so the route answers 500 and Stripe redelivers; swallowing it would drop the event
permanently. Before delegating, the succeeded branch re-creates the payment row if it is missing, which is
what makes a failed deferred write from `createPayment` or `activateWithPayment` recoverable.

**`MissingDonorEmailError` is the one failure that goes the other way**, and the asymmetry is the point. The
event factory refuses to invent an email when a succeeded intent carries neither `metadata.email` nor
`receipt_email`, because that address is the only key Premium can ever be recovered by
([ADR 0008](../../../../../adr/0008-premium-derived-from-payment.md)) and a blank one orphans the Donation
permanently. But redelivering the same intent will produce the same missing email forever, so the succeeded
branch logs it at error level through `tapError` and then absorbs it, letting the route answer 2xx. Retrying
a failure that can never succeed is not resilience. The log is the whole remedy here: the payer has paid and
someone has to go and find them, which is why the message says so rather than reading like a warning.

## Testing

Each file has a co-located `.test.ts` built on a `TestLayer` of `Layer.succeed(Tag, mockImplementation)` for every
tag in `R`, with local `run` / `runFail` / `runDeferred` helpers over it (`runFail` uses `Effect.flip`, so the
assertion is `expect(err).toBeInstanceOf(ValidationError)`). Validation via
[`zodParse.ts`](../shared/utils/zodParse.ts) is mocked to a pass-through where the flow under test is not the schema,
and the deferred is asserted separately from the critical path: persistence *not* called during `run`, and called
after `runDeferred`.
- [`activatePremium.test.ts`](./activatePremium.test.ts) additionally runs `activateWithEmail` against a layer providing `TursoService`
  alone. The recovery path never logs, so `LoggerService` must stay out of its requirements channel; that
  test fails to compile (not at runtime) the moment a tag creeps back in.

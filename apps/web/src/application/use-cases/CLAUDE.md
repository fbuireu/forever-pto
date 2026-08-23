# apps/web/src/application/use-cases

## Purpose

The four server-side flows that combine more than one external service: taking a Donation, activating
Premium, handling the Stripe webhook, and sending a contact message. A use-case is an Effect *program*: a
value, not a call. It composes service tags and repository functions, declares what it can fail with, and
returns. It never runs itself, never reaches for a request, and never decides an HTTP status.

## Files

| File | Exports | Combines |
| --- | --- | --- |
| `payment.ts` | `createPayment` | promo-code validation, Stripe intent creation, deferred persistence |
| `activatePremium.ts` | `activateWithPayment`, `activateWithEmail` | Stripe intent lookup, payment repository, session minting |
| `webhook.ts` | `processWebhookEvent` | payment repository, the `@domain/payment` event factory and handlers |
| `contact.ts` | `sendContactEmail` | Zod validation, React Email render, Resend, deferred persistence |

## The entry-point convention

Every export is `(input, …) => Effect.Effect<A, E, R>` built with `Effect.gen`, with all three type
parameters written out explicitly rather than inferred. That signature is the contract:

- **`R`** lists the service tags the caller must provide: `StripeServerService`, `TursoService`,
  `ResendService`, `LoggerService`. Tags are `yield*`-ed out of context; no client is ever constructed here.
- **`E`** lists the tagged errors from `errors.ts` the caller has to map. The boundary matches on
  `_tag` via `Effect.catchTags`, so adding a failure mode to `E` turns every unhandled call site into a
  type error instead of a silent 500 ([ADR 0002](../../../../../adr/0002-effect-for-external-service-boundaries.md)).
- Success values are plain objects. Nothing here builds a `NextResponse`.

Failures the flow is expected to survive are absorbed in place rather than widening `E`: a repository read
that only guards an idempotency check is `Effect.catchAll`-ed to `undefined`.

Logging comes in three shapes here and the choice is about *when* the line runs, never about safety. A log
attached to a failure sits in `Effect.sync` inside `tapError` (`webhook.ts`, `payment.ts`) or inside
`catchAll` where the failure is also being absorbed (`contact.ts`, `activatePremium.ts`); a log describing a
successful branch is a bare statement in the generator body (`webhook.ts` lines around the dispatch). None of
them needs a guard, because `BetterStackClient` cannot throw; see
[`../../infrastructure/clients/CLAUDE.md`](../../infrastructure/clients/CLAUDE.md). Do not add `Effect.sync`
for protection: a throw inside it is a defect too, so it would buy nothing.

## Termination is the caller's job, not ours

Nothing in this folder calls `Effect.runPromise` or provides a layer. Each entry point, meaning the route handlers
under `src/app/api/` and the server actions in `@infrastructure/actions`, pipes the program through
`Effect.provide(ApplicationLayer)` (`layers.ts`), maps the typed errors to a status, adds a
`catchAll` fallback for the untyped remainder, and runs it. Forgetting the layer is a compile error, not a
runtime one.

Two entry points exist for the same operation: `/api/payment` and the `createPaymentAction` server action
both call `createPayment`, and both must keep behaving identically (rate limit first, same error mapping).
The same holds for `sendContactEmail`.

## Configuration arrives as plain values

A use-case must not call `getCloudflareContext()`. The Cloudflare context is only valid inside a request,
and a use-case is a value that may be run later, including from inside `after()`, after the response has
been sent ([ADR 0004](../../../../../adr/0004-cloudflare-workers-as-deployment-target.md)). The caller reads
the context and passes what it found down as an ordinary object: `sendContactEmail` takes
`{ siteUrl, contactEmail }`, `createPayment` takes `{ userAgent, ipAddress }`. Anything read from headers,
cookies or `env` belongs in that parameter.

## The deferred effect

Three of the four use-cases return a `deferred: Effect.Effect<void, never, TursoService>` alongside their
result. It holds the database writes that the user's response does not depend on; the caller schedules it
with `after(() => Effect.runPromise(deferred.pipe(Effect.provide(ApplicationLayer))))`. The layer has to be
provided a second time, because the outer program's runtime is gone by then.

Two properties of that type are deliberate:

- **`never` in the error channel.** Every failure inside is caught and logged, because there is no longer a
  response to fail. A lost write is invisible outside the logs, which is why `processWebhookEvent` re-creates
  a missing payment row: the webhook is the backstop for a deferred write that did not land.
- **`TursoService` alone in `R`.** The logger is resolved in the outer `Effect.gen` and captured by the
  closure, so the deferred does not require `LoggerService` even though it logs.

`activateWithEmail` returns `Effect.void` as its deferred, since the recovery path has nothing to persist, so the
caller can treat all four uniformly.

## Premium activation

`activatePremium.ts` is the code behind [ADR 0008](../../../../../adr/0008-premium-derived-from-payment.md):
there is no accounts table, so a succeeded payment record *is* the entitlement, and both exports end by
minting the same 30-day session token via `createSession` in `session.ts`.

The two paths are deliberately asymmetric, and this is the trap:

- `activateWithPayment` (straight after a Donation) **verifies**. It retrieves the payment intent from
  Stripe, rejects anything not `succeeded`, and takes the payer's address from `metadata.email` or
  `receipt_email`. An intent carrying neither was not created by the Donation flow and cannot prove the
  caller owns it, so it is refused rather than trusted. Its two optional parameters each add a check and
  neither weakens the flow when absent: `expectedEmail` must match the intent's address, and `clientSecret`
  must match the intent's own. The callers differ because they can prove different things: `POST
  /api/check-session` holds an email the browser typed and passes `expectedEmail`; `GET
  /api/payment/activate` holds the secret Stripe appended to the `return_url` and passes `clientSecret`,
  which is the stronger of the two since only someone who completed the payment has it. Deriving the email
  from the intent is what lets the redirect path activate at all, since the payer may come back in a browser
  that never held their address.
- `activateWithEmail` (the "I already donated" recovery path) **does not verify**. It looks up a succeeded
  payment by email and grants access. That is accepted, not overlooked, so do not "fix" it in passing.

The critical path never writes to the database. Reading the intent and minting the token are the only steps
that must succeed; creating or repairing the payment row happens in the deferred. `activateWithPayment`
therefore does not require `TursoService` at all; that requirement lives only on its deferred.

`ValidationError` is the only failure the boundary turns into a 400 here, and its `message` is returned to
the client verbatim, so keep those strings safe to show and free of anything about the payer.

**That is why the Stripe read is not relabelled, and it used to be.** `stripe.paymentIntents.retrieve` was
piped through `Effect.mapError((e) => new ValidationError({ message: e.message }))`, which took an outage or
a bad key (a `PaymentError`, mapped to 500 `INTERNAL_ERROR` everywhere else) and turned it into the one tag
whose message is shown. The path that reaches it is the post-charge one: `confirmPayment` POSTs to
`/api/check-session` immediately after the card clears, and on a non-ok response the checkout adapter returns
`FAILED_AFTER_CHARGE` carrying `errorData.error`, which `resolveApiErrorMessage` renders as prose because it
*is* prose. So a Stripe blip after the money moved showed the payer something like
`No such payment_intent: 'pi_3ABC…'`, under a 400 telling every layer above that the request was wrong and
there was nothing to retry. `PaymentError` now travels in `activateWithPayment`'s error channel and
`check-session` maps it beside `SessionError` and `DatabaseError`. `ValidationError` is reserved for the
three conditions this file decides for itself: secret mismatch, not succeeded, email mismatch.

## Webhook

`processWebhookEvent` receives an already-verified `Stripe.Event`; signature checking happens at the route,
because it needs the raw body and the signature header. The use-case switches on `event.type`, builds a
domain event through the `@domain/payment` factory, and delegates to `handlePaymentSucceeded` /
`handlePaymentFailed`. Unknown types are logged and ignored, never rejected: Stripe sends event types nobody
subscribed to and a non-2xx would put them into retry.

Genuine failures must propagate. A handler error is logged *and* re-raised as `DatabaseError` so the route
answers 500 and Stripe redelivers, because swallowing it would drop the event permanently. Before delegating, the
succeeded branch re-creates the payment row if it is missing, which is what makes a failed deferred write
from `createPayment` or `activateWithPayment` recoverable.

**`MissingDonorEmailError` is the one failure that goes the other way**, and the asymmetry is the point. The
event factory now refuses to invent an email when a succeeded intent carries neither `metadata.email` nor
`receipt_email`, because that address is the only key Premium can ever be recovered by
([ADR 0008](../../../../../adr/0008-premium-derived-from-payment.md)) and a blank one orphans the Donation
permanently. But redelivering the same intent will produce the same missing email forever, so the succeeded
branch logs it at error level through `tapError` and then absorbs it, letting the route answer 2xx. Retrying
a failure that can never succeed is not resilience. The log is the whole remedy here: the payer has paid and
someone has to go and find them, which is why the message says so rather than reading like a warning.

## Testing

Each file has a co-located `.test.ts`. The pattern is identical across the four and worth copying:

- Build a `TestLayer` with `Layer.succeed(Tag, mockImplementation)` for every tag in `R`. No test constructs
  a real Stripe, Turso or Resend client.
- Define local `run` / `runFail` / `runDeferred` helpers over that layer. `runFail` uses `Effect.flip` so the
  assertion can be `expect(err).toBeInstanceOf(ValidationError)` rather than a `rejects` matcher.
- `vi.mock` the repository and service modules so they return `Effect.succeed(...)`; validation via
  `zodParse.ts` is mocked to a pass-through where the flow under test is not the schema.
- Assert the deferred separately from the critical path: that persistence was *not* called during `run`,
  and *was* called after `runDeferred`. That split is the invariant, so it is what the tests protect.
- `activatePremium.test.ts` additionally runs `activateWithEmail` against a layer providing `TursoService`
  alone. The recovery path never logs, so `LoggerService` must stay out of its requirements channel; that
  test fails to compile, not at runtime, the moment a tag creeps back in.


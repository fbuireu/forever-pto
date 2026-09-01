# apps/web/src/infrastructure/api

The wire vocabulary for failures, the response helper that opts out of caching, the request-body parser, and
`operations/`, where the three flows that exist behind *two* transports are terminated once.

## Files

| File | Contents |
| --- | --- |
| [`errors.ts`](./errors.ts) | `ApiError` (the machine-readable failure codes that go on the wire) and `describeFailure`, the one tag→status table |
| [`response.ts`](./response.ts) | `noStore({ body, init })`: `NextResponse.json` with `Cache-Control: no-store` |
| [`parseJsonBody.ts`](./parseJsonBody.ts) | `parseJsonBody<T>(request)`: `request.json()` as an Effect, plus the `INVALID_BODY` code |
| [`operations/types.ts`](./operations/types.ts) | `ApiOutcome<BODY>` (`{ status, body }`), `RequestContext`, `resolveClientIp`, `UNKNOWN_IP` |
| [`operations/payment.ts`](./operations/payment.ts) | `createPaymentRequest`: rate limit, use-case, deferred write and failure mapping, transport-free |
| [`operations/contact.ts`](./operations/contact.ts) | `sendContactRequest`: the same shape for the contact form |
| [`operations/activatePremium.ts`](./operations/activatePremium.ts) | `activatePremiumRequest`: the rate limit, the deferred hand-off, the status map and a log line per failure, for the two transports that grant Premium |

**The log line carries the failure's own fields, not one field every failure was assumed to have.** It read
`failure.message`, and `RateLimitError` is `Data.TaggedError("RateLimitError")<{ ip: string }>`: no `message`
prop, so `Error.prototype.message` answered `''` and the one endpoint an attacker would enumerate against
logged `reason: ""` with the address nowhere in the entry. `failureContext` takes the error's own enumerable
properties instead, adds `reason` only when there is a message, and keeps `cause` out because Effect leaves it
non-enumerable, which is what stops a raw SDK error object reaching the log. The payload is asserted per tag
in the `it.each`, which the old `toHaveBeenCalledOnce()` could not do.

**There is no trailing `catchAll` after `Effect.provide` there, and adding one back is dead code.** The
`catchAll` above it closes the error channel to `never` and `ApplicationLayer` is four `Layer.sync`s that
cannot fail, so nothing could ever reach it; a defect would not, either, since `catchAll` does not see one.

## The Premium activation operation owns its rate limit now

`activatePremiumRequest` takes `{ ipAddress }` and the *use-case* program, and runs `checkRateLimit` itself.
It used to take whatever pipeline the caller handed it, and the two transports disagreed about what that
should contain: `api/payment/activate` composed `checkRateLimit(ip).pipe(Effect.andThen(…))` before calling
in, and `api/check-session`'s `POST` passed a program with **no limiter at all**, an endpoint that grants
Premium from an email address, and therefore the one an attacker would enumerate against.

That ordering is the thing this folder exists to own, and while the operation accepted any program it was
neither enforceable nor assertable at the seam. It is asserted once now: a limited caller never reaches the
use-case, verified by moving the limiter after it and watching the case go red. **Adding the limiter to
`check-session` is a behaviour change**: that endpoint can now answer 429 where it previously could not.

`resolveClientIp(headers) ?? UNKNOWN_IP` came with it. The `?? UNKNOWN_IP` half had crawled back up into
`api/payment/activate`, which is exactly the pair of lines `operations/types.ts` was created to stop drifting:
`'unknown'` from one transport and `null` from the other is the defect recorded below.

**The outcome stays a flat union rather than `ApiOutcome<BODY>`, unlike its two siblings, and that is not an
oversight.** It carries a `token` that must go into a `Set-Cookie` and must *not* reach the JSON body, so
`{ status, body }` cannot express it without a second field beside the body. What did go is the branch that
chose the failure body from the status: `check-session` answered `{ error, premiumKey: null }` on a 400 and
`{ error }` on anything else, so a `RateLimitError` took the 429 branch and dropped a field the client was
assumed to destructure. It does not: `verifyPremiumEmail` returns `null` on any non-ok response and never
reads the body, and [`checkout.ts`](../../ui/adapters/payments/checkout.ts) reads `error` alone. Every failure answers `{ error }`.

## One operation, two transports

Payment creation and contact submission each have a route handler **and** a server action. They are meant to
behave identically, and for a long while they were two hand-written copies of one policy: same four
`catchTags` branches, same rate-limit call, same `after()` hand-off, restated per transport. They had already
drifted: a request with no IP header wrote the string `'unknown'` into the payments table through the route
and `null` through the action, because the two resolved the address with a different chain of headers.

`operations/` is the seam that removes the possibility. Each operation is an `async` function taking the input
as an **Effect** (`parseJsonBody(request)` from a route, `Effect.succeed(params)` from an action) and
answering an `ApiOutcome`: a status and a body. It provides `ApplicationLayer`, maps every tagged failure, and
schedules the deferred half. The route wraps the outcome in `NextResponse.json(body, { status })`; the action
returns `body` and drops the status. Nothing else differs, because nothing else is allowed to.

Taking the input as an Effect rather than a value is what lets a malformed body stay a `ValidationError` on the
route path while the action path has nothing to parse, and it is what makes the ordering testable: the
limiter runs before the input Effect is ever evaluated, so [`operations/payment.test.ts`](./operations/payment.test.ts) can assert the body is
not read when the limiter refuses. That ordering used to be a rule stated in prose and asserted twice, once
per entry point.

`resolveClientIp` is the settled version of the drift: it reads `cf-connecting-ip`, then `x-forwarded-for`,
then `x-real-ip`, and answers `null` when none is present. **That order is a security decision, not a
preference**: behind Cloudflare only the first is set by the edge, and the other two arrive from the client;
[`operations/types.test.ts`](./operations/types.test.ts) names it, and until it existed the third rung had never been executed by any test
and the first two were covered incidentally, through a server action with two mocks. The limiter keys on `UNKNOWN_IP` in that case
because a limiter needs a key; the use-case receives the `null`, because a payment record should say we do not
know the address rather than claim it is called "unknown".

## From a typed failure to a status code

A use-case fails with a tagged error declared in [`src/infrastructure/errors.ts`](../errors.ts) (`DatabaseError`, `EmailError`, `MissingDonorEmailError`, `PaymentError`, `PromoCodeError`, `RateLimitError`, `SessionError`, `ValidationError`, `WebhookError`). The entry point, the only place the program is run, turns each tag into a status and a body. That mapping is the whole reason this folder exists; see [ADR 0002](../../../../../adr/0002-effect-for-external-service-boundaries.md).

What the code does today:

**This table is a description of `describeFailure` in `errors.ts`, not a hand-maintained mirror of three
`catchTags` blocks.** It was the latter: `ApiError.INTERNAL_ERROR` appeared seven times across the two
operations and check-session, always with `status: 500`, and `ValidationError → 400, message verbatim` was
written out three times. The mapping is a property of the *error*, not of the transport, so it lives once:
`FAILURE_RESPONSES` is typed `{ [TAG in TaggedFailure['_tag']]: … }`, which means a tag added to the union
without a row is a compile error rather than a silent fall into the catch-all. Each operation now ends in one
`Effect.catchAll` that calls `describeFailure` and wraps the answer in **its own** body shape: the status and
the code are shared, the body is not, which is why `operations/payment.ts` still adds `isPromoCodeError` and
check-session still adds `premiumKey: null`.

`describeFailure` falls back to 500 for a tag it does not know. That is not a hole in the exhaustiveness: the
type already guarantees every member of the union has a row, and the fallback is what keeps the safety net
under a value that arrived lying about its type, which a test injecting an off-union error does deliberately.

| Tagged error | Status | `error` in the body | Mapped in |
| --- | --- | --- | --- |
| `RateLimitError` | 429 | `RATE_LIMIT_EXCEEDED` | `errors.ts` |
| `ValidationError` | 400 | the error's own `message`, verbatim | `errors.ts` |
| `PromoCodeError` | 400 | the error's `code`, plus `isPromoCodeError: true` | `errors.ts` |
| `PaymentError` | 400 or 500 | `INVALID_PAYMENT_REFERENCE` (400) when the provider rejected the reference the caller supplied, else `INTERNAL_ERROR` (500) | `errors.ts` |
| `EmailError` | 500 | `INTERNAL_ERROR` | `errors.ts` |
| `SessionError`, `DatabaseError` | 500 | `INTERNAL_ERROR` | `errors.ts` |
| `WebhookError` | 400 or 500 | `INVALID_SIGNATURE` when `isSignatureError`, `WEBHOOK_MISCONFIGURED` (400) when the secret is missing, else `WEBHOOK_PROCESSING_FAILED` (500) | [`src/app/api/webhooks/stripe/route.ts`](../../app/api/webhooks/stripe/route.ts) |
| `MissingDonorEmailError` | None | never reaches the wire: absorbed and logged in [`webhook.ts`](../../application/use-cases/webhook.ts) | `src/application/use-cases/webhook.ts` |

A `PaymentRequestError` carries the `PaymentError` tag for the same reason, and is the one payment failure
that is the caller's fault rather than the system's. `wrapError` in [`serverService.ts`](../clients/payments/stripe/serverService.ts) raised every Stripe
rejection as a plain `PaymentError`, so `pi_invalid` — a reference the visitor typed — answered **500
`INTERNAL_ERROR`**, the same as Stripe being down. It now narrows on `StripeInvalidRequestError`, which is
what Stripe raises for a malformed or unknown id, and `describeFailure` narrows back on
`isPaymentRequestError` to answer **400 `INVALID_PAYMENT_REFERENCE`**. The body still carries a fixed code
rather than the provider's message, so nothing about which references exist reaches the wire; only the
status stops lying about whose fault it was. A transport failure stays a plain `PaymentError` and a 500,
which is the distinction the single wrapper could not express.

A `WebhookConfigurationError` (Stripe is not configured) carries the `WebhookError` tag, so the handler
narrows on `isWebhookConfigurationError` from [`serverService.ts`](../clients/payments/stripe/serverService.ts) and answers **400 `WEBHOOK_MISCONFIGURED`**,
logged at error level, rather than the 500 the other webhook failures take. A missing secret can never
succeed on redelivery, and a 5xx asks Stripe to keep trying.

Two things about that branch are worth knowing before changing it. Stripe retries on **any** non-2xx, not
only 5xx, so the 400 does not stop redelivery on its own; what it does is mark the endpoint as failing so
Stripe disables it and mails the account, which is the outcome we want for a permanent misconfiguration. And
answering 2xx instead is not the safer choice it looks like: without the webhook secret nothing was verified
and nothing was processed, so a 2xx would claim success for an event that is then lost. The failure stays
visible in the Stripe dashboard on purpose.

`isWebhookConfigurationError` narrows in a way that makes the *negative* branch `never`:
`WebhookConfigurationError` extends `WebhookError` and adds no members, so the two are structurally
identical and TypeScript computes the exclusion as `never`. Reading `isSignatureError` after the guard
therefore does not compile; the handler destructures it *before* the guard. That is not a style choice, and
undoing it breaks the build.

Three codes never come from a tagged error, because the request is rejected before any program starts: `MISSING_SIGNATURE` (no `stripe-signature` header), `EMAIL_REQUIRED` (no email in the check-session body), and `NOT_FOUND` (unknown slug in the `.well-known` catch-all). Do not look for them in a `catchTags` map.

## Why the body is parsed inside the program

`INVALID_BODY` is the case that had to be pulled back the other way. `request.json()` rejects on a malformed or empty body, and a rejection raised *before* the program starts escapes every `catchTags` map; Next turns it into a bare 500 with no code at all. `parseJsonBody` does the parse inside `Effect.tryPromise`, so a bad body fails as a `ValidationError` and takes the same 400 branch as `email_required`. Every entry point that reads a JSON body yields it as its first step; none calls `request.json()` directly.

A body that parses but is not an object (a bare JSON string, a number, `null`) fails the same way rather than reaching a schema as a nonsense value.

`INVALID_BODY` lives in `parseJsonBody.ts` beside the schema codes rather than in `ApiError` because that is where it belongs semantically: it reaches the client as a `ValidationError` message, exactly like `email_required` and the rest of the DTO codes, not as an `error` value the handler picked.

The `GET` half of check-session is the odd one out: a `SessionError` there is not an error response at all. It returns `200` with `{ premiumKey: null, email: null }`, because an expired token is a normal state, not a failure. Whether it also clears the premium cookie depends on which `SessionError` it is: `isSessionConfigurationError` from [`../services/premium/sessionErrors.ts`](../services/premium/sessionErrors.ts) narrows off the "could not verify" case, `JWT_SECRET` absent, which keeps the cookie and logs at error, because nothing about the token was established either way. See [`../../app/CLAUDE.md`](../../app/CLAUDE.md).

## What the typed error channel actually buys

`FAILURE_RESPONSES` in `errors.ts` is typed `{ [TAG in TaggedFailure['_tag']]: … }`, so every tag in the union
has a row or the file does not compile. That is the property the old shape lacked: three `catchTags` maps, each
covering the tags *that use-case* declared, each ending in an `Effect.catchAll` returning `INTERNAL_ERROR`,
so adding a failure mode and forgetting to map it compiled fine and quietly became a 500 with the generic
code. The catch-all was the safety net and the blind spot at once.

**The blind spot narrowed but did not close, and the remaining half is worth knowing.** Adding a new tagged
error to `errors.ts` and to a use-case's channel *does* now fail to compile, but only once that tag joins
`TaggedFailure`. Leave it out of the union and the operation's `catchAll` still receives it and
`describeFailure` still answers 500. So the thing to update by hand is one line, the union, rather than
three maps, and the compiler takes it from there.

`Effect.catchTags` is still the right tool where a branch is genuinely local rather than a property of the
error: the webhook route narrows `WebhookError` on `isWebhookConfigurationError`, and the `GET` half of
check-session turns a `SessionError` into a 200.

## Codes are not translated here, but they are translated

`ApiError` values are snake_case identifiers, not messages, and nothing in this folder localises them. Three
namespaces do it at the edge: `toasts.promoCodeErrors.*`, looked up in [`Donate.tsx`](../../ui/modules/shared/donate/Donate.tsx); `contact.errors.*`; and
`checkout.errors.*`. [`ContactModal.tsx`](../../ui/modules/shared/contact/ContactModal.tsx) and [`CheckoutForm.tsx`](../../ui/modules/premium/CheckoutForm.tsx) both route the code through
`resolveApiErrorMessage` from [`src/ui/modules/shared/utils/helpers.ts`](../../ui/modules/shared/utils/helpers.ts), which decides by shape: a
machine code (snake_case with no whitespace) is looked up in the component's namespace and falls back to a
generic translated message when the namespace has no key for it, while prose is shown as it came, because
that is how a Stripe message Stripe has already localised arrives. So a code a user can see is displayed raw
only when nobody added a key for it. Add the key when you add the code, and note that a `checkout` failure
whose outcome is `FAILED_AFTER_CHARGE` bypasses the lookup entirely; see
[`../../ui/CLAUDE.md`](../../ui/CLAUDE.md).

`ValidationError` messages are the sharpest edge. Server-side parsing uses the default schemas in [`src/application/dto/payment/schema.ts`](../../application/dto/payment/schema.ts) and [`src/application/dto/contact/schema.ts`](../../application/dto/contact/schema.ts), whose messages are themselves codes (`email_required`, `amount_too_low`). The UI rebuilds the same schemas with translated messages for client-side validation, so a user normally sees prose, but a request that reaches the server unvalidated gets the code back and displays it. If you add a code a user can see, give it a lookup of its own; do not assume the code is presentable.

## Response shapes the handlers depend on

- A failure body always carries `error`. The payment and contact paths add `success: false`; the promo-code branch adds `isPromoCodeError: true`; a check-session validation failure adds `premiumKey: null`.
- `ApiError` exports values only; there is no exported code type and no response-body type. Every consumer types `error` as `string`, which is what lets `ValidationError` put arbitrary text there. If you want a closed set on the wire, that type has to be added first.
- `noStore` is used by [`src/app/api/health/route.ts`](../../app/api/health/route.ts) and [`src/app/api/check-session/route.ts`](../../app/api/check-session/route.ts); every other handler calls `NextResponse.json` directly. The rule is the body, not the route: check-session reads the premium cookie and sets or clears it on the same response, so a cached copy would hand one user another user's premium state. Reach for `noStore` whenever the body depends on cookies or per-request state.

## Adding a new failure mode

1. Declare the tagged error in `src/infrastructure/errors.ts` and add it to the use-case's error channel.
2. Add a code to `ApiError` only if a client has to branch on it. If it just means "we failed", reuse `INTERNAL_ERROR`.
3. Map the tag in the `catchTags` of whatever runs the program. For payment and contact that is one place, the operation under `operations/`, and both transports pick the change up. For check-session and the webhook it is still the route handler.
4. If it is user-visible, add the message key to every locale bundle. The docs consistency suite fails when a bundle's keys differ from [`en.json`](../../ui/i18n/messages/en.json).
5. Assert the status and the code in the route test.

## Testing

[`response.test.ts`](./response.test.ts) covers `noStore` directly: body, default and custom status, the header, and that custom headers survive alongside it. [`parseJsonBody.test.ts`](./parseJsonBody.test.ts) pins the three outcomes: an object body succeeds, a malformed body fails with `INVALID_BODY`, and so does a non-object one.

[`errors.test.ts`](./errors.test.ts) owns the tag→status table, and it is the *only* place that table is asserted. This file used to say `errors.ts` had no test and that its contract lived in the route tests; both halves were false, and the second one was the expensive half: every transport re-asserted all five rows through its own mock stack, so `actions/payment.ts`, nineteen lines long, carried a 156-line test. A transport test now covers what the transport alone decides: the route puts the operation's body and status on a `NextResponse` and hands it `parseJsonBody`; the action drops the status; each maps the request's own headers or config onto the operation's input. The ordering, the deferral and the body shapes stay in [`operations/`](./operations/), and the statuses stay here. Route tests still compare against `ApiError.*` rather than string literals, with three exceptions, all in `e2e/`: `'email_required'` in [`check-session.spec.ts`](../../../e2e/api/check-session.spec.ts), and `'missing_signature'` and `'invalid_signature'` in [`webhooks-stripe.spec.ts`](../../../e2e/api/webhooks-stripe.spec.ts). Change a code's value and those assertions are the ones that will not follow you.

This paragraph used to say `e2e/` "deliberately imports no app source", and that was already untrue when it was written: `page.spec.ts` and `planner.spec.ts` both import a locale constant, and [`markdown.spec.ts`](../../../e2e/api/markdown.spec.ts) now imports the twin's header name, Accept value and route. Importing is the better default there: a spec asserting a 404 against a hard-coded header name passes for the wrong reason the day the header is renamed. What is true is narrower: **these three error codes are literals**, and nothing makes them follow the const.

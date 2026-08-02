# src/infrastructure/api

Three small modules every route handler and server action leans on: the wire vocabulary for failures, the one response helper that opts out of caching, and the request-body parser. Nothing here runs an Effect, imports a client, or knows a domain rule — it is plain values, one `NextResponse` wrapper and one `Effect.tryPromise`.

## Files

| File | Contents |
| --- | --- |
| `errors.ts` | `ApiError` — the machine-readable failure codes that go on the wire |
| `response.ts` | `noStore(body, init?)` — `NextResponse.json` with `Cache-Control: no-store` |
| `parseJsonBody.ts` | `parseJsonBody<T>(request)` — `request.json()` as an Effect, plus the `INVALID_BODY` code |

## From a typed failure to a status code

A use-case fails with a tagged error declared in `src/infrastructure/errors.ts` (`DatabaseError`, `EmailError`, `MissingDonorEmailError`, `PaymentError`, `PromoCodeError`, `RateLimitError`, `SessionError`, `ValidationError`, `WebhookError`). The entry point — the only place the program is run — maps each tag with `Effect.catchTags` onto a status and a body. That mapping is the whole reason this folder exists; see [ADR 0002](../../../docs/adr/0002-effect-for-external-service-boundaries.md).

What the code does today:

| Tagged error | Status | `error` in the body | Mapped in |
| --- | --- | --- | --- |
| `RateLimitError` | 429 | `RATE_LIMIT_EXCEEDED` | `src/app/api/payment/route.ts`, `src/infrastructure/actions/payment.ts` |
| `ValidationError` | 400 | the error's own `message`, verbatim | payment, contact and check-session entry points |
| `PromoCodeError` | 400 | the error's `code`, plus `isPromoCodeError: true` | `src/app/api/payment/route.ts`, `src/infrastructure/actions/payment.ts` |
| `PaymentError` | 500 | `INTERNAL_ERROR` | `src/app/api/payment/route.ts`, `src/infrastructure/actions/payment.ts` |
| `EmailError` | 500 | `INTERNAL_ERROR` | `src/app/api/contact/route.ts`, `src/infrastructure/actions/contact.ts` |
| `SessionError`, `DatabaseError` | 500 | `INTERNAL_ERROR` | `src/app/api/check-session/route.ts` |
| `WebhookError` | 400 or 500 | `INVALID_SIGNATURE` when `isSignatureError`, `WEBHOOK_MISCONFIGURED` (400) when the secret is missing, else `WEBHOOK_PROCESSING_FAILED` (500) | `src/app/api/webhooks/stripe/route.ts` |
| `MissingDonorEmailError` | — | never reaches the wire: absorbed and logged in `webhook.ts` | `src/application/use-cases/webhook.ts` |

A `WebhookConfigurationError` — Stripe is not configured — carries the `WebhookError` tag, so the handler
narrows on `isWebhookConfigurationError` from `serverService.ts` and answers **400 `WEBHOOK_MISCONFIGURED`**,
logged at error level, rather than the 500 the other webhook failures take. A missing secret can never
succeed on redelivery, and a 5xx asks Stripe to keep trying.

Two things about that branch are worth knowing before changing it. Stripe retries on **any** non-2xx, not
only 5xx, so the 400 does not stop redelivery on its own — what it does is mark the endpoint as failing so
Stripe disables it and mails the account, which is the outcome we want for a permanent misconfiguration. And
answering 2xx instead is not the safer choice it looks like: without the webhook secret nothing was verified
and nothing was processed, so a 2xx would claim success for an event that is then lost. The failure stays
visible in the Stripe dashboard on purpose.

`isWebhookConfigurationError` narrows in a way that makes the *negative* branch `never`:
`WebhookConfigurationError` extends `WebhookError` and adds no members, so the two are structurally
identical and TypeScript computes the exclusion as `never`. Reading `isSignatureError` after the guard
therefore does not compile — the handler destructures it *before* the guard. That is not a style choice, and
undoing it breaks the build.

Three codes never come from a tagged error, because the request is rejected before any program starts: `MISSING_SIGNATURE` (no `stripe-signature` header), `EMAIL_REQUIRED` (no email in the check-session body), and `NOT_FOUND` (unknown slug in the `.well-known` catch-all). Do not look for them in a `catchTags` map.

## Why the body is parsed inside the program

`INVALID_BODY` is the case that had to be pulled back the other way. `request.json()` rejects on a malformed or empty body, and a rejection raised *before* the program starts escapes every `catchTags` map — Next turns it into a bare 500 with no code at all. `parseJsonBody` does the parse inside `Effect.tryPromise`, so a bad body fails as a `ValidationError` and takes the same 400 branch as `email_required`. Every entry point that reads a JSON body yields it as its first step; none calls `request.json()` directly.

A body that parses but is not an object — a bare JSON string, a number, `null` — fails the same way rather than reaching a schema as a nonsense value.

`INVALID_BODY` lives in `parseJsonBody.ts` beside the schema codes rather than in `ApiError` because that is where it belongs semantically: it reaches the client as a `ValidationError` message, exactly like `email_required` and the rest of the DTO codes, not as an `error` value the handler picked.

The `GET` half of check-session is the odd one out: a `SessionError` there is not an error response at all. It returns `200` with `{ premiumKey: null, email: null }` and clears the premium cookie, because an expired token is a normal state, not a failure.

## What the typed error channel actually buys

The keys of an `Effect.catchTags` map are checked against the error channel declared by the use-case, so a misspelled tag or one that can no longer occur is a compile error rather than a branch that never fires.

The limit is worth knowing before you rely on it: every entry point ends in `Effect.catchAll(...)` returning `INTERNAL_ERROR`. Add a new failure mode to a use-case and forget to map it, and nothing fails to compile — the request quietly becomes a 500 with the generic code. The catch-all is the safety net and the blind spot at once. Treat the `catchTags` map as the thing you must update by hand.

## Codes are not translated here, but they are translated

`ApiError` values are snake_case identifiers, not messages, and nothing in this folder localises them. Three
namespaces do it at the edge: `toasts.promoCodeErrors.*`, looked up in `Donate.tsx`; `contact.errors.*`; and
`checkout.errors.*`. `ContactModal.tsx` and `CheckoutForm.tsx` both route the code through
`resolveApiErrorMessage` from `src/ui/modules/shared/utils/helpers.ts`, which decides by shape: a
machine code — snake_case with no whitespace — is looked up in the component's namespace and falls back to a
generic translated message when the namespace has no key for it, while prose is shown as it came, because
that is how a Stripe message Stripe has already localised arrives. So a code a user can see is displayed raw
only when nobody added a key for it. Add the key when you add the code, and note that a `checkout` failure
carrying `charged: true` bypasses the lookup entirely — see [`../../ui/CLAUDE.md`](../../ui/CLAUDE.md).

`ValidationError` messages are the sharpest edge. Server-side parsing uses the default schemas in `src/application/dto/payment/schema.ts` and `src/application/dto/contact/schema.ts`, whose messages are themselves codes (`email_required`, `amount_too_low`). The UI rebuilds the same schemas with translated messages for client-side validation, so a user normally sees prose — but a request that reaches the server unvalidated gets the code back and displays it. If you add a code a user can see, give it a lookup of its own; do not assume the code is presentable.

## Response shapes the handlers depend on

- A failure body always carries `error`. The payment and contact paths add `success: false`; the promo-code branch adds `isPromoCodeError: true`; a check-session validation failure adds `premiumKey: null`.
- `ApiError` exports values only — there is no exported code type and no response-body type. Every consumer types `error` as `string`, which is what lets `ValidationError` put arbitrary text there. If you want a closed set on the wire, that type has to be added first.
- `noStore` is used by `src/app/api/health/route.ts` and `src/app/api/check-session/route.ts`; every other handler calls `NextResponse.json` directly. The rule is the body, not the route: check-session reads the premium cookie and sets or clears it on the same response, so a cached copy would hand one user another user's premium state. Reach for `noStore` whenever the body depends on cookies or per-request state.

## Adding a new failure mode

1. Declare the tagged error in `src/infrastructure/errors.ts` and add it to the use-case's error channel.
2. Add a code to `ApiError` only if a client has to branch on it. If it just means "we failed", reuse `INTERNAL_ERROR`.
3. Map the tag in the `catchTags` of every entry point that runs the program. Grep the tag name — the payment and contact flows each have two runners, a route handler and a server action, and they are meant to agree.
4. If it is user-visible, add the message key to every locale bundle. The docs consistency suite fails when a bundle's keys differ from `en.json`.
5. Assert the status and the code in the route test.

## Testing

`response.test.ts` covers `noStore` directly: body, default and custom status, the header, and that custom headers survive alongside it. `parseJsonBody.test.ts` pins the three outcomes: an object body succeeds, a malformed body fails with `INVALID_BODY`, and so does a non-object one.

`errors.ts` has no test of its own. Its contract lives in the route tests, which compare response bodies against `ApiError.*` rather than string literals — with three exceptions, all in `e2e/`, which deliberately imports no app source: `'email_required'` in `check-session.spec.ts`, and `'missing_signature'` and `'invalid_signature'` in `webhooks-stripe.spec.ts`. Change a code's value and that assertion is the one that will not follow you.

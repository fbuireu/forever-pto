# 2. Effect on external service boundaries, plain TypeScript everywhere else

Date: 2026-07-26

## Status

Accepted. The split it draws inside `src/domain/` is [ADR 0003](./0003-pure-calendar-domain-effectful-payment-domain.md).

## Context

The server-side paths that talk to Stripe, Turso and Resend fail in many distinct ways (a declined card, an expired promo code, a database write that lost a race, a mail provider that rate-limits), and every one of them has to become a specific HTTP status and a specific translated message at the API boundary. Written with `try`/`catch` that mapping is a chain of `instanceof` checks the compiler cannot check for exhaustiveness, and each new failure mode silently falls through to a 500.

The alternative considered was plain `async`/`await` with a discriminated result type. It would have avoided the dependency entirely, but dependency injection would then have to be hand-rolled or threaded through every call site, and the exhaustiveness of the error mapping would hold by convention rather than by the compiler, which is the property that was actually wanted.

## Decision

Every server-side path that talks to an external service is written as an Effect program with a typed error channel and its dependencies injected as service tags. The calendar engine and almost all of the React tree stay plain TypeScript. New code that only transforms data stays plain: the boundary is external I/O, not "code that might fail".

Three shapes are deliberate, and the first two contradict the one-line version of this rule:

**Logging is not on the Effect side of the line.** BetterStack has both an Effect service tag and a plain singleton, and the singleton is the one used across the stores, the holiday and country lookups, the country-detection strategies and several React components, anywhere there is no layer to provide. Any claim that "all external calls go through Effect" is wrong for logging specifically.

**Three browser files use Effect**, and the list is exact rather than approximate, because the point of writing it down is that a fourth needs a reason. [`ui/adapters/payments/checkout.ts`](../apps/web/src/ui/adapters/payments/checkout.ts) orchestrates the fallible Stripe and session calls and collapses every failure into a plain result object; [`ui/modules/sidebar/components/CalendarExport.tsx`](../apps/web/src/ui/modules/sidebar/components/CalendarExport.tsx) uses scoped acquire/release to guarantee an object URL is revoked after the PDF download; and [`infrastructure/services/holidays/getHolidays.ts`](../apps/web/src/infrastructure/services/holidays/getHolidays.ts) wraps a synchronous computation that can throw. All three are orchestration of fallible side effects, which is the same reason as on the server. But it does mean Effect is not confined to the server.

The browser Stripe client was a fourth, and is not one any more. [`infrastructure/clients/payments/stripe/client.ts`](../apps/web/src/infrastructure/clients/payments/stripe/client.ts) is now a lazy `loadStripe` singleton with no `effect` import at all: the confirm-and-classify chain it used to hold moved into the checkout adapter, which is the first entry above. Counting it twice is the mistake this paragraph exists to stop, because a reader told there are four will either hunt for a fifth or put Effect back into a module that was deliberately emptied.

**A tagged error may be subclassed to carry a sub-case, and the subclass keeps the parent's `_tag`.** [`infrastructure/services/premium/sessionErrors.ts`](../apps/web/src/infrastructure/services/premium/sessionErrors.ts) declares `SessionConfigurationError extends SessionError`, and `wrapSessionError` returns one when the cause is a `MissingJWTSecret`. Every caller's error channel is unchanged, because `Data.TaggedError("SessionError")` supplies the `_tag` and the subclass does not override it; `sessionErrors.test.ts` asserts that on purpose. The check-session route then discriminates with `isSessionConfigurationError`, an `instanceof` guard, and keeps the premium cookie instead of clearing it, because a missing `JWT_SECRET` says nothing about the user's session.

That is an `instanceof` check the compiler cannot prove exhaustive, which is the exact shape the Context above gives as the reason for adopting Effect, so it needs sanctioning rather than silence. It is allowed because the two axes are different. Effect's typed error channel is there so the *boundary* mapping to an HTTP status cannot silently gain a fall-through case; this guard runs **inside** one `catchTag` handler that has already exhaustively matched `SessionError`, and it splits one already-handled failure into two responses. Both branches are total, so nothing falls through. The rule that follows: a subclass may refine a failure the error channel already carries, but it may never be the thing a boundary maps a status from. The moment a sub-case needs its own status, it needs its own `_tag` and its own arm in the boundary's match.

## Consequences

- Tests substitute a service tag with a mock layer, so no test ever constructs a real Stripe, Turso or Resend client.
- Every entry point must terminate the program itself, providing the application layer and running it. Forgetting to provide a layer is a type error, not a runtime one.
- Effect is a large concept to onboard onto, and the boundary is a judgement call rather than a lint rule. There is no import-boundary rule enforcing it; review is the only check.

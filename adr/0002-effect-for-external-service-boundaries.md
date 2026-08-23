# 2. Effect on external service boundaries, plain TypeScript everywhere else

Date: 2026-07-26

## Status

Accepted. The split it draws inside `src/domain/` is [ADR 0003](./0003-pure-calendar-domain-effectful-payment-domain.md).

## Context

The server-side paths that talk to Stripe, Turso and Resend fail in many distinct ways (a declined card, an expired promo code, a database write that lost a race, a mail provider that rate-limits), and every one of them has to become a specific HTTP status and a specific translated message at the API boundary. Written with `try`/`catch` that mapping is a chain of `instanceof` checks the compiler cannot check for exhaustiveness, and each new failure mode silently falls through to a 500.

The alternative considered was plain `async`/`await` with a discriminated result type. It would have avoided the dependency entirely, but dependency injection would then have to be hand-rolled or threaded through every call site, and the exhaustiveness of the error mapping would hold by convention rather than by the compiler, which is the property that was actually wanted.

## Decision

Every server-side path that talks to an external service is written as an Effect program with a typed error channel and its dependencies injected as service tags. The calendar engine and almost all of the React tree stay plain TypeScript. New code that only transforms data stays plain: the boundary is external I/O, not "code that might fail".

Two exceptions are deliberate, and both contradict the one-line version of this rule:

**Logging is not on the Effect side of the line.** BetterStack has both an Effect service tag and a plain singleton, and the singleton is the one used across the stores, the holiday and country lookups, the country-detection strategies and several React components, anywhere there is no layer to provide. Any claim that "all external calls go through Effect" is wrong for logging specifically.

**Four browser files use Effect.** The checkout adapter orchestrates fallible Stripe and session calls; the calendar export uses scoped acquire/release to guarantee an object URL is revoked after the PDF download; the browser Stripe client sequences the fallible load-then-confirm chain and collapses every failure into a plain result object; and the holiday lookup wraps a synchronous computation that can throw. All four are orchestration of fallible side effects, which is the same reason as on the server. But it does mean Effect is not confined to the server.

## Consequences

- Tests substitute a service tag with a mock layer, so no test ever constructs a real Stripe, Turso or Resend client.
- Every entry point must terminate the program itself, providing the application layer and running it. Forgetting to provide a layer is a type error, not a runtime one.
- Effect is a large concept to onboard onto, and the boundary is a judgement call rather than a lint rule. There is no import-boundary rule enforcing it; review is the only check.

# 3. The calendar domain is pure; the payment domain is not

Date: 2026-07-26

## Status

Accepted. Refines [ADR 0002](./0002-effect-for-external-service-boundaries.md) for the two bounded contexts under `src/domain/`.

## Context

A domain layer is normally held to one rule, and a reader who finds two different rules inside the same folder assumes one of them is a mistake. Here they are not.

The calendar context is executed in a second runtime: the planner runs it inside a Web Worker, with no DOM and no server context ([ADR 0001](./0001-planner-runs-in-the-browser.md)). Anything it imports has to be evaluable there. The payment context has the opposite shape — it never leaves the server, and every operation it performs is an orchestration of fallible external calls, which is exactly what [ADR 0002](./0002-effect-for-external-service-boundaries.md) puts on the Effect side of the line.

The uniform alternative would be to hold both to purity, extracting repository interfaces into the domain and pushing Effect out to the application layer. That adds a set of interfaces whose only implementation is the one already sitting behind an Effect service tag — indirection bought with no substitutability gained, since the tags are already substitutable in tests.

## Decision

The two bounded contexts follow different rules on purpose.

**`calendar/` is pure.** Its only outside imports are the holiday DTO type, the shared date helpers, `temporal-polyfill` and the `next-intl` locale type. It must not import from `@infrastructure/*` and must not depend on Effect.

**`payment/` is not pure and is not meant to be.** It composes Effect programs directly against infrastructure service tags and references the Stripe payment-intent type inside its event factory. The tags are interfaces, so the layer stays substitutable in tests — but the dependency on infrastructure is real, and saying so is better than pretending otherwise.

## Consequences

- Do not "fix" the payment context by extracting repository interfaces into the domain. The service tags already are the interfaces, and tests already substitute them.
- Do relentlessly guard the calendar context. Anything imported there must be safe to evaluate in a worker with no DOM and no server context — a single stray import breaks the planner in a way no server-side test would catch.
- Neither rule is lint-enforced; there is no import-boundary rule in the Biome config. A violation is caught in review or not at all.

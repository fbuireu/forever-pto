# apps/web/src/domain

The business rules, in bounded contexts that deliberately do not follow the same rule. Nothing here
renders, routes, reads a request or reaches for a browser global. The vocabulary is
[`CONTEXT.md`](../../../../CONTEXT.md).

## Bounded contexts

| Directory | Responsibility | Where it runs |
| --- | --- | --- |
| [`calendar/`](./calendar/AGENTS.md) | The planning engine: Workday enumeration, Bridge detection, Strategy selection, Alternatives, Metrics | browser main thread and Web Worker |
| [`payment/`](./payment/AGENTS.md) | Domain events for a Donation, and the Effect programs that handle them | server only |

They share no code and no types; Premium, the only thing that connects them, joins them in the application
layer.

## Rival rules, on purpose

A reader who finds rival contracts inside one layer assumes one is a mistake. Both are intended; see
[ADR 0003](../../../../adr/0003-pure-calendar-domain-effectful-payment-domain.md).

**`calendar/` is pure.** Its outside imports are this list:

- `@application/dto/holiday/types`: `HolidayDTO` and `HolidayVariant`
- `@application/shared/utils/dates`: the Temporal-backed date helpers. The arrow points the wrong way and
  stays that way on purpose; the alternatives cost more than the tidiness is worth, and
  [ADR 0012](../../../../adr/0012-shared-date-helpers-stay-in-the-application-layer.md) records why. A new
  entry has to resolve inside a Web Worker with no DOM and no server context
- `temporal-polyfill`, in `utils/helpers.ts` only, for `PlainYearMonth.daysInMonth`
- `next-intl`, the `Locale` type alone, threaded through [`pipeline.ts`](./calendar/pipeline.ts) to the Metrics, where it formats month names

No `@infrastructure/*`, no `@ui/*`, no Effect. The reason is the runtime rather than taste: the planner
evaluates this code inside a Web Worker with no DOM and no server context
([ADR 0001](../../../../adr/0001-planner-runs-in-the-browser.md)). An import that touches `window`,
`process` or a Node built-in breaks the planner in a way no server-side test will catch, because every
test in this repo runs on the main thread.

`HolidayDTO` living in the application layer is a layering inversion on paper, since the type describes a
Holiday, so it belongs here. It is a known exception, safe only because the file holds types, the
`HolidayVariant` const object and its predicate, `isHolidayVariant`, and imports nothing but types. See
[`../application/dto/AGENTS.md`](../application/dto/AGENTS.md).

**`payment/` is not pure and is not meant to be.** It composes Effect programs directly against
infrastructure (the service tags under `@infrastructure/clients/*` and `@infrastructure/logging/service`, the
functions under `@infrastructure/services/payments/*` and the tagged errors in `@infrastructure/errors`) and holds
`import type Stripe` in its event factory. The tags are interfaces, so tests substitute them without a
network, but the dependency on infrastructure is real, and naming it is better than pretending. Do not
"fix" it by extracting repository interfaces into the domain; ADR 0003 weighed that and rejected it.

## What a broken calendar import looks like

The contract suite holds both contexts to their imports. What it cannot see is a module that resolves and then
touches a browser or server global when it runs, and the calendar fails quietly on one: the bundle still builds,
the worker throws at runtime, `useCalculationsWorker`'s `onerror` discards the worker and clears the loading flag
without reporting anything, and there is no main-thread fallback, so the user sees an empty plan and no error.
`Temporal` comes from `temporal-polyfill` ([ADR 0005](../../../../adr/0005-temporal-polyfill.md)), almost always
indirectly, through `@application/shared/utils/dates`.

## Testing

Every module with behaviour has a co-located `.test.ts`, run by Vitest, except
[`calendar/utils/candidates.ts`](./calendar/utils/candidates.ts) and [`calendar/utils/spans.ts`](./calendar/utils/spans.ts),
which the generator, selector and stretch suites exercise. A few have none:
[`calendar/const.ts`](./calendar/const.ts) is a tunables object, [`payment/events/types.ts`](./payment/events/types.ts) is types plus `PAYMENT_SUCCEEDED`,
and [`payment/events/factory/resolvers.ts`](./payment/events/factory/resolvers.ts) is covered through [`events.test.ts`](./payment/events/factory/events.test.ts). [`calendar/types.ts`](./calendar/types.ts) has one:
it holds `isStrategy`, the predicate the Web Worker narrows an incoming strategy string with, and
`DEFAULT_STRATEGY`, the value both that fallback and the filters store's initial state read.

- `calendar/` tests take literal inputs and assert on returned values; the two that spy (`pipeline.test.ts`,
  `generateSuggestions.test.ts`) wrap the real functions. The caches in
  [`calendar/utils/cache.ts`](./calendar/utils/cache.ts) are module-level and survive between cases in the same
  file, so a suite whose subject reaches `getKey` or `createHolidaySet` clears them with `clearDateKeyCache()` and
  `clearHolidayCache()` in `beforeEach` ([ADR 0006](../../../../adr/0006-caller-owned-calculation-caches.md)),
  unless its subject is `runPlanningPipeline`, which clears both itself; the `metrics/` subtree and the selector's
  own suite reach neither cache. See [`calendar/AGENTS.md`](./calendar/AGENTS.md).
- `payment/` tests build a `Layer.succeed(Tag, mock)` for every tag the handler requires and run the program
  over it.

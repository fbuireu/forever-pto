# src/domain

The business rules, in two bounded contexts that deliberately do not follow the same rule. Nothing here
renders, routes, reads a request or reaches for a browser global. The vocabulary is
[`CONTEXT.md`](../../CONTEXT.md) — a variable named for a retired term is a defect here, not a style
preference.

## Bounded contexts

| Directory | Responsibility | Where it runs |
| --- | --- | --- |
| [`calendar/`](./calendar/CLAUDE.md) | The planning engine: Workday enumeration, Bridge detection, Strategy selection, Alternatives, Metrics | browser main thread and Web Worker |
| [`payment/`](./payment/CLAUDE.md) | Domain events for a Donation, and the Effect programs that handle them | server only |

They share no code and no types, and there is no reason for one to import the other. Premium is the only
thing that connects them, and that connection lives in the application layer, not here.

## Two rules, on purpose

A reader who finds two contracts inside one layer assumes one is a mistake. Both are intended — see
[ADR 0003](../../docs/adr/0003-pure-calendar-domain-effectful-payment-domain.md).

**`calendar/` is pure.** Its outside imports are exactly four, and the list is meant to stay that short:

- `@application/dto/holiday/types` — `HolidayDTO` and `HolidayVariant`
- `@application/shared/utils/dates` — the Temporal-backed date helpers
- `temporal-polyfill` — in `utils/helpers.ts` only, for `PlainYearMonth.daysInMonth`
- `next-intl` — the `Locale` type alone, for month-name formatting in the Metrics

No `@infrastructure/*`, no `@ui/*`, no Effect. The reason is the runtime rather than taste: the planner
evaluates this code inside a Web Worker with no DOM and no server context
([ADR 0001](../../docs/adr/0001-planner-runs-in-the-browser.md)). An import that touches `window`,
`process` or a Node built-in breaks the planner in a way no server-side test will catch, because every
test in this repo runs on the main thread.

`HolidayDTO` living in the application layer is a layering inversion on paper — the type describes a
Holiday, so it belongs here. It is a known exception, safe only because the file is types plus one const
object. See [`../application/dto/CLAUDE.md`](../application/dto/CLAUDE.md).

**`payment/` is not pure and is not meant to be.** It composes Effect programs directly against
infrastructure service tags (`@infrastructure/clients/*`, `@infrastructure/services/payments/*`) and holds
`import type Stripe` in its event factory. The tags are interfaces, so tests substitute them without a
network — but the dependency on infrastructure is real, and naming it is better than pretending. Do not
"fix" it by extracting repository interfaces into the domain; ADR 0003 weighed that and rejected it.

## Neither rule is enforced

There is no import-boundary rule in the Biome config. Both contracts hold by review or not at all. The
calendar one fails quietly: the bundle still builds, the worker throws at runtime, and
`useCalculationsWorker` only clears the loading flag on `onerror` — there is no main-thread fallback, so
the user sees an empty plan and no error. That is the contract to guard.

## Temporal never comes from the global

`Temporal` resolves from `temporal-polyfill` only, never the ambient global, because the global does not
exist in the deployed Workers runtime and a local run proves nothing
([ADR 0005](../../docs/adr/0005-temporal-polyfill.md)). Almost all use here is indirect, through
`@application/shared/utils/dates`.

## Testing

Every module with behaviour has a co-located `.test.ts`, run by Vitest. Four have none and should not grow
one: [`calendar/const.ts`](./calendar/const.ts) is a tunables object, [`calendar/types.ts`](./calendar/types.ts) and [`payment/events/types.ts`](./payment/events/types.ts) are types
plus the `FilterStrategy` const, and [`payment/events/factory/resolvers.ts`](./payment/events/factory/resolvers.ts) is covered through
[`events.test.ts`](./payment/events/factory/events.test.ts).

- `calendar/` tests take literal inputs and assert on returned values — there is nothing to mock. Those
  whose subject reaches `getKey` or `createHolidaySet` **must** call `clearDateKeyCache()` and
  `clearHolidayCache()` in `beforeEach`: the caches in [`calendar/utils/cache.ts`](./calendar/utils/cache.ts) are module-level and
  survive between cases in the same file
  ([ADR 0006](../../docs/adr/0006-caller-owned-calculation-caches.md)). The `metrics/` subtree reaches
  neither and is exempt — see [`calendar/CLAUDE.md`](./calendar/CLAUDE.md).
- `payment/` tests build a `Layer.succeed(Tag, mock)` for every tag the handler requires and run the
  program over it. No test constructs a real Stripe or Turso client.

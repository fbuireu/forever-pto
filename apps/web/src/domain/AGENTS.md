# apps/web/src/domain

The business rules, in two bounded contexts held to one rule: pure. Nothing here renders, routes, reads a
request, reaches for a browser global, runs an Effect program or names a vendor's type. The vocabulary is
[`GLOSSARY.md`](../../../../GLOSSARY.md).

## Bounded contexts

| Directory | Responsibility | Where it runs |
| --- | --- | --- |
| [`calendar/`](./calendar/AGENTS.md) | The planning engine: Workday enumeration, Bridge detection, Strategy selection, Alternatives, Metrics | browser main thread and Web Worker |
| [`payment/`](./payment/AGENTS.md) | The events a Donation's webhook turns into and the payment statuses: types and constants only | server only |

They share no code and no types; Premium, the only thing that connects them, joins them in the application
layer.

## One rule, and the calendar's narrower list

**Nothing under `domain/` imports `effect`, `@infrastructure/*` or a vendor SDK** (`stripe`, `@stripe/stripe-js`,
`@stripe/react-stripe-js`, `@tursodatabase/serverless`, `resend`, `@opennextjs/cloudflare`), and an `import type`, a
type-position `import()` or a `vi.mock` path counts as well. The rule covers both contexts and their tests;
[ADR 0023](../../../../docs/adr/0023-the-payment-domain-is-types.md) records why. Effect has one place per layer:
infrastructure declares the tags, the layers, the tagged errors and the wrapping of every vendor call, a use case
composes them, the edge runs it, and the domain holds the types and the rules all three speak.

So a program that asks for a service tag is a use case under
[`../application/use-cases/`](../application/use-cases/AGENTS.md), and a function that reads a vendor's shape is
that vendor's adapter under `@infrastructure/*`. The payment context shows both: `handlePaymentSucceeded` and
`handlePaymentFailed` are use cases, and the factory that turns a Stripe `PaymentIntent` into an event is
[`provider/events.ts`](../infrastructure/services/payments/provider/events.ts) in the payments service. Do not
extract repository interfaces into the domain to move them back: the service tags already are the interfaces, and
tests already substitute them.

**`calendar/` is narrower still.** Its outside imports are this list:

- `@application/dto/holiday/types`: `HolidayDTO` and `HolidayVariant`
- `@application/shared/utils/dates`: the Temporal-backed date helpers. The arrow points the wrong way and
  stays that way on purpose; the alternatives cost more than the tidiness is worth, and
  [ADR 0012](../../../../docs/adr/0012-shared-date-helpers-stay-in-the-application-layer.md) records why. A new
  entry has to resolve inside a Web Worker with no DOM and no server context
- `temporal-polyfill`, in `utils/helpers.ts` only, for `PlainYearMonth.daysInMonth`
- `next-intl`, the `Locale` type alone, threaded through [`pipeline.ts`](./calendar/pipeline.ts) to the Metrics, where it formats month names

No `@ui/*` either. The reason is the runtime rather than taste: the planner evaluates this code inside a Web
Worker with no DOM and no server context
([ADR 0001](../../../../docs/adr/0001-planner-runs-in-the-browser.md),
[ADR 0003](../../../../docs/adr/0003-pure-calendar-domain-effectful-payment-domain.md)). An import that touches
`window`, `process` or a Node built-in breaks the planner in a way no server-side test will catch, because every
test in this repo runs on the main thread.

`HolidayDTO` living in the application layer is a layering inversion on paper, since the type describes a
Holiday, so it belongs here. It is a known exception, safe only because the file holds types, the
`HolidayVariant` const object and its predicate, `isHolidayVariant`, and imports nothing but types. See
[`../application/dto/AGENTS.md`](../application/dto/AGENTS.md).

**`payment/` imports nothing.** [`payment/events/types.ts`](./payment/events/types.ts) is the events and the
statuses, read by the use cases, the payments service and the payment DTO rules; see
[`payment/AGENTS.md`](./payment/AGENTS.md).

## What a broken calendar import looks like

The contract suite holds both contexts to their imports. What it cannot see is a module that resolves and then
touches a browser or server global when it runs, and the calendar fails quietly on one: the bundle still builds,
the worker throws at runtime, `useCalculationsWorker`'s `onerror` discards the worker and clears the loading flag
without reporting anything, and there is no main-thread fallback, so the user sees an empty plan and no error.
`Temporal` comes from `temporal-polyfill` ([ADR 0005](../../../../docs/adr/0005-temporal-polyfill.md)), almost always
indirectly, through `@application/shared/utils/dates`.

## Testing

Every module with behaviour has a co-located `.test.ts`, run by Vitest, except
[`calendar/utils/candidates.ts`](./calendar/utils/candidates.ts) and [`calendar/utils/spans.ts`](./calendar/utils/spans.ts),
which the generator, selector and stretch suites exercise. A few have none:
[`calendar/const.ts`](./calendar/const.ts) is a tunables object and [`payment/events/types.ts`](./payment/events/types.ts) is types plus
`PAYMENT_STATUSES` and `PAYMENT_SUCCEEDED`, which the contract suite and the payment DTO rules' test read. [`calendar/types.ts`](./calendar/types.ts) has one:
it holds `isStrategy`, the predicate the Web Worker narrows an incoming strategy string with, and
`DEFAULT_STRATEGY`, the value both that fallback and the filters store's initial state read.

- `calendar/` tests take literal inputs and assert on returned values; the two that spy (`pipeline.test.ts`,
  `generateSuggestions.test.ts`) wrap the real functions. The caches in
  [`calendar/utils/cache.ts`](./calendar/utils/cache.ts) are module-level and survive between cases in the same
  file, so a suite whose subject reaches `getKey` or `createHolidaySet` clears them with `clearDateKeyCache()` and
  `clearHolidayCache()` in `beforeEach` ([ADR 0006](../../../../docs/adr/0006-caller-owned-calculation-caches.md)),
  unless its subject is `runPlanningPipeline`, which clears both itself; the `metrics/` subtree and the selector's
  own suite reach neither cache. See [`calendar/AGENTS.md`](./calendar/AGENTS.md).
- `payment/` has no test of its own: nothing in it runs.

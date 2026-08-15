# apps/web/src/infrastructure/workers

## Purpose

The browser Web Worker that runs the planning pipeline off the main thread. The planner computes everything
client-side ([ADR 0001](../../../../../adr/0001-planner-runs-in-the-browser.md)), so a full run — suggestions,
alternatives and metrics for each of them — is the one piece of work in the app long enough to freeze a
slider drag if it stayed on the main thread.

This is a **Web Worker**, not a Cloudflare Worker. Nothing in this folder runs on the server, and the
Cloudflare Worker that hosts the app is configured in `wrangler.toml`, not here.

## Files

**This folder holds no planning rule.** `worker.ts` deserialises a request, calls `runPlanningPipeline` from
`@domain/calendar`, serialises the result and posts it. Everything the handler used to do around those calls —
clearing the caches, building the `manual-N` pseudo-Holidays, deriving `carryOverMonths`, computing the
budget, short-circuiting an empty plan, measuring each Suggestion — moved into that module, because the
holidays store had its own copy of all of it and the two were kept in step by a pair of hand-mirrored test
suites. A rule you want to change is in the domain; what lives here is the boundary.

| File | Contents |
| --- | --- |
| `worker.ts` | The entry point. Registers `globalThis.onmessage`, calls the pipeline, replies with `self.postMessage` |
| `types.ts` | `WORKER_MESSAGE_TYPE`, `CalculateSuggestionsRequest`, `WorkerResponse`, and the `Serialized*` wire types |
| `utils/serializers.ts` | Both directions of the boundary conversion, in one file so they cannot drift apart |

The other half of the contract lives outside this folder: `useCalculationsWorker.ts` under `@ui/hooks/` spawns
the worker, builds the request and deserialises the reply. Change `types.ts` and you are changing both.

## The protocol

The main thread posts one `CalculateSuggestionsRequest` carrying a `requestId`; the worker replies with a
`WorkerResponse`, a discriminated union of a result and an error, echoing the same `requestId`.

```
main thread                              worker
    |                                       |
    |── CALCULATE_SUGGESTIONS ────────────▶ | deserialise
    |                                       | runPlanningPipeline
    |◀── CALCULATE_SUGGESTIONS_RESULT ───── | serialise
    |    or WORKER_ERROR                    |
```

A message whose `type` is not `CALCULATE_SUGGESTIONS` is dropped without a reply — the worker is not a general
dispatcher, and adding a second message type means adding an early return, not an `else`.

The handler is wrapped end to end in `try`/`catch` and posts a `WORKER_ERROR` carrying `String(err)`, so the
main thread always gets exactly one message per request. `useCalculationsWorker.ts` still installs `onerror`
and `onmessageerror` handlers, because a worker that fails to *load* never reaches this code.

## Invariants

**This worker no longer clears the calculation caches, and must not start again.** `runPlanningPipeline`
clears them on entry, which is what the 2026-08-14 amendment to
[ADR 0006](../../../../../adr/0006-caller-owned-calculation-caches.md) moved. The pipeline call sits inside the
handler's `try`, after the message-type guard, so a throw anywhere in a run still becomes a `WORKER_ERROR` and
an unrelated message never starts one.

**`Temporal` reaches this thread through `temporal-polyfill`.** The engine imports it explicitly rather than
using the global, and this worker is one of the three realms that has to work
([ADR 0005](../../../../../adr/0005-temporal-polyfill.md)). Nothing here imports `Temporal` directly, but a
codemod that "modernises" the engine's import breaks this thread too.

**The way back from a string is `fromStoredInstant`, not `new Date`.** Everything crossing this boundary was
written by this app with `toISOString()`, so the instant is the thing being round-tripped — the same
provenance the persistence layer has, and the same intake function answers it
([`@application/shared/utils/dateIntake`](../../application/CLAUDE.md)). `serializers.ts` and `worker.ts`
called `new Date(x)` inline seven times between them, which is the rule that module exists to hold restated
as bare code. `fromUpstreamCalendarDay` is the wrong tool here and would silently discard the time component.

**Every `Date` crosses as an ISO string, in both directions.** This is not a structured-clone limitation —
structured clone carries `Date` natively. It is a choice to make the boundary an explicit, inspectable type:
`SerializedHolidayDTO`, `SerializedBridge` and `SerializedSuggestion` in `types.ts` are what the two sides
agree on, and `utils/serializers.ts` is the only place that converts. Adding a `Date` field to a domain type
that crosses here means adding it to the serialiser and to the wire type, or it arrives as a string typed as a
`Date`.

**`Metrics` is the one domain type reused verbatim.** `types.ts` imports `Metrics` from `@domain/calendar/types`
rather than mirroring it, and that is safe only because `Metrics` holds no `Date` — every field is a number, a
number array or a `{ first, last }` pair of strings. Put a `Date` in `Metrics` and `SerializedSuggestion`
starts lying without a single type error.

**`SerializedSuggestion.metrics` is required, not optional, and the serialisers speak `MeasuredSuggestion`.**
The pipeline measures both of its branches, so a Suggestion crossing this boundary always has Metrics; saying
so on the wire type is what lets the store hold `MeasuredSuggestion` and the planner screen stop
optional-chaining. `deserializeSuggestion` returns `MeasuredSuggestion` on that strength — it still casts
rather than validates, so a wire message genuinely missing `metrics` would arrive as a lie. Nothing else
produces these messages, which is what makes the claim safe.

**Deserialisation casts, it does not validate.** `deserializeHolidays` casts `variant` to
`HolidayDTO['variant']` and `deserializeSuggestion` casts `strategy` to `Suggestion['strategy']`; `worker.ts`
casts the incoming `strategy` string to `FilterStrategy`. An unknown string reaches the engine unchallenged.

## Manual and Removed Days

The two kinds of hand-edited day reach the engine by different routes, and that asymmetry is the point.

- **Manual days** reach the *planning* calls only as pseudo-holidays (`id: 'manual-N'`, `variant: CUSTOM`)
  appended to the real holidays as `holidaysWithManual`. A manual day is genuinely a day off, so counting it
  as free for Bridge expansion is correct. They additionally reach both `generateMetrics` calls **by name**,
  as `manuallySelectedDays: manualDates`, because a Metric needs to know not just that the day is free but
  that the user *paid* for it: without the parameter the denominator is the days the engine placed by itself
  while the numerator still counts spans expanded through the manual ones, which inflates Efficiency and
  Bonus Days. See the *Public API* section of
  [`@domain/calendar/CLAUDE.md`](../../domain/calendar/CLAUDE.md).
- **Removed Days** are dates the user has told us they *will work*. They cross as ISO strings, are mapped
  straight to `Date` objects and are handed to `generateSuggestions` and `generateAlternatives` as
  `removedDays`, and to both `generateMetrics` calls as `removedSuggestedDays`. They are never turned into
  holidays. Passing them to the Metrics is belt and braces rather than load-bearing —
  `getAvailableWorkdays` already excludes them, so a Removed Day cannot appear in `suggestion.days` for
  `resolveSelectedDays` to strip — but it keeps the two arguments symmetric and matches what
  `toggleDaySelection` does on the store side.

**A day passed both ways must only be counted once.** `holidaysWithManual` and `manuallySelectedDays`
overlap by construction, so any Metric that subtracts Holidays and PTO Days as two independent counts
subtracts every Manual Day twice. `getWorkedDaysPerMonth` did exactly that and understated Worked Days per
month by one day per Manual Day; it now unions both lists into a set of `toDateString()` keys before
counting. Every other Metric touching both lists already built a set. A new Metric that reads `holidays` and
`ptoDays` together has to do the same.

The engine drops a `removedDays` date from the Workday list and stops there: it does not become a Free Day
for Bridge expansion or scoring. Folding them back into the holidays array would restore exactly the bias the
parameter exists to remove — see the traps in
[`@domain/calendar/CLAUDE.md`](../../domain/calendar/CLAUDE.md). Tests in `worker.test.ts` pin both halves:
that `removedDays` arrives as dates on the planner calls, and that no Removed Day appears in any
holidays array.

`generateMetrics` also takes the request's `year`. It scopes Max Work Streak and Worked Days per month, and
the worker passes the payload's `year` rather than letting the engine guess from the first placed day, which
lands in `year + 1` whenever the plan starts in the Carry-over Months.

## The budget, and the empty-result short circuit

Both live in `runPlanningPipeline` now; the rule is in
[`@domain/calendar/CLAUDE.md`](../../domain/calendar/CLAUDE.md). What matters on this side is the wire: the
pipeline's `planned: false` result carries an empty Suggestion whose `metrics` are **measured by the engine**,
so `serializeSuggestionResult` has a real object to send and `currentSelection.metrics` is never `undefined`.

`worker.ts` used to hand-write that object as a module-level `EMPTY_METRICS` constant, and it was wrong in a
way nothing caught: it hard-coded twelve monthly buckets and four quarterly ones, while the engine sizes both
to the Planning Window — so with any Carry-over Month the empty plan reported a differently-shaped `Metrics`
than a real one. Deriving it removed the constant and the bug together.

The consequence that remains is the stored empty plan being what the next run reads back, which is how an
emptied selection can pin the auto-suggest cap at zero. `useCalculationsWorker.ts` guards that by treating a
computed cap of `0` as "no cap".

## A worker per calculation, on purpose

`useCalculationsWorker.ts` terminates the in-flight worker and spawns a fresh one on every recalculation. That
reads like waste and is not: the handler in `worker.ts` is fully synchronous, so a reused worker cannot be
preempted — queued messages sit behind the running computation and execute to completion. `terminate()` is the
only thing that actually cancels a run. The `requestId` guard discards stale *results*; it does nothing about
stale *work*.

## Testing

`worker.test.ts` stubs `self` with `vi.stubGlobal`, mocks the four engine modules, then `await import('./worker')`
for its registration side effect — the import must come after the stubs, and the mocks are `vi.hoisted` for the
same reason. Messages are driven by invoking `globalThis.onmessage` directly.

What it pins, and should keep pinning: that this side hands the pipeline the right inputs — manual days become
`CUSTOM` pseudo-holidays, Removed Days reach the planner as `removedDays` and appear in no holidays array at
all, `generateMetrics` gets the request's `year`, manual days are deducted from the budget — that an
over-committed budget short-circuits to an empty result whose `Metrics` came from the engine rather than a
literal, and that a throw becomes `WORKER_ERROR` rather than an unhandled rejection.

Those input assertions reach through the pipeline to the mocked generators, which is why the mocks are keyed
on the engine modules and not on the pipeline: mocking the pipeline would assert only that the worker called
it. The pipeline's own behaviour is pinned once, against the real engine, in
[`pipeline.test.ts`](../../domain/calendar/pipeline.test.ts) — including the cache clearing, which is now
testable as behaviour (run twice, check the second run answers for its own Holidays) rather than as two spy
calls in no particular order.

`utils/serializers.test.ts` covers the round trip. It is the cheaper place to catch a new `Date` field than a
worker test is.

# src/infrastructure/workers

## Purpose

The browser Web Worker that runs the planning pipeline off the main thread. The planner computes everything
client-side ([ADR 0001](../../../docs/adr/0001-planner-runs-in-the-browser.md)), so a full run — suggestions,
alternatives and metrics for each of them — is the one piece of work in the app long enough to freeze a
slider drag if it stayed on the main thread.

This is a **Web Worker**, not a Cloudflare Worker. Nothing in this folder runs on the server, and the
Cloudflare Worker that hosts the app is configured in `wrangler.toml`, not here.

## Files

| File | Contents |
| --- | --- |
| `worker.ts` | The entry point. Registers `globalThis.onmessage`, runs the pipeline, replies with `self.postMessage` |
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
    |── CALCULATE_SUGGESTIONS ────────────▶ | clearDateKeyCache / clearHolidayCache
    |                                       | generateSuggestions
    |                                       | generateAlternatives
    |◀── CALCULATE_SUGGESTIONS_RESULT ───── | generateMetrics per suggestion
    |    or WORKER_ERROR                    |
```

A message whose `type` is not `CALCULATE_SUGGESTIONS` is dropped without a reply — the worker is not a general
dispatcher, and adding a second message type means adding an early return, not an `else`.

The handler is wrapped end to end in `try`/`catch` and posts a `WORKER_ERROR` carrying `String(err)`, so the
main thread always gets exactly one message per request. `useCalculationsWorker.ts` still installs `onerror`
and `onmessageerror` handlers, because a worker that fails to *load* never reaches this code.

## Invariants

**Both calculation caches are cleared before any work.** `clearDateKeyCache()` and `clearHolidayCache()` open
the handler's `try` block — after the message-type guard, so an unrelated message never wipes them, and
inside the `try`, so a throw while clearing still becomes a `WORKER_ERROR`. The engine memoises the holiday set under one fixed key and never evicts it,
so a second run would silently reuse the first run's holidays. This worker is one of exactly two callers that
own that clear — the other is the holidays store, `holidays.ts` under `@application/stores/`
([ADR 0006](../../../docs/adr/0006-caller-owned-calculation-caches.md)).

**`Temporal` reaches this thread through `temporal-polyfill`.** The engine imports it explicitly rather than
using the global, and this worker is one of the three realms that has to work
([ADR 0005](../../../docs/adr/0005-temporal-polyfill.md)). Nothing here imports `Temporal` directly, but a
codemod that "modernises" the engine's import breaks this thread too.

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

**Deserialisation casts, it does not validate.** `deserializeHolidays` casts `variant` to
`HolidayDTO['variant']` and `deserializeSuggestion` casts `strategy` to `Suggestion['strategy']`; `worker.ts`
casts the incoming `strategy` string to `FilterStrategy`. An unknown string reaches the engine unchallenged.

## Manual and Removed Days

The two kinds of hand-edited day reach the engine by different routes, and that asymmetry is the point.

- **Manual days** have no parameter of their own. They become pseudo-holidays (`id: 'manual-N'`,
  `variant: CUSTOM`) appended to the real holidays as `holidaysWithManual`, which is what both planning
  entry points *and* both `generateMetrics` calls receive. A manual day is genuinely a day off, so counting
  it as free is correct everywhere.
- **Removed Days** are dates the user has told us they *will work*. They cross as ISO
  strings, are mapped straight to `Date` objects and are handed to `generateSuggestions` and
  `generateAlternatives` as `removedDays`. They are never turned into holidays and never reach
  `generateMetrics`.

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

`effectivePtoDays = Math.max(0, autoSuggestCount ?? ptoDays - manualDays.length)`. `??` binds looser than `-`,
so the fallback is `ptoDays - manualDays.length` as a whole: an explicit `autoSuggestCount` wins outright, and
otherwise hand-placed days come out of the budget.

When `effectivePtoDays <= 0` — or `holidaysWithManual` is empty, which is the honest reading of "no Holidays
to bridge": Removed Days no longer keep a run alive, because they are not holidays — the worker posts
`{ suggestion: { days: [], metrics: EMPTY_METRICS }, alternatives: [] }` and returns without running the
engine. `EMPTY_METRICS` is a module-level constant in `worker.ts`, typed as `Metrics` so a new field cannot
be forgotten, and it reproduces by hand the zeroed object `generateMetrics` returns for an empty day list:
the short circuit must never leave `currentSelection.metrics` `undefined`, and it must not call the engine to
avoid it. The consequence that remains is the stored empty plan being what the next run reads back, which is
how an emptied selection can pin the auto-suggest cap at zero. `useCalculationsWorker.ts` guards that by
treating a computed cap of `0` as "no cap".

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

What it pins, and should keep pinning: that both caches are cleared on every run — the test asserts the two
calls, not their order, so ordering rests on review; that manual days
become `CUSTOM` pseudo-holidays; that Removed Days reach the planner as `removedDays` and appear in no
holidays array at all; that `generateMetrics` gets the request's `year`; that manual days are deducted from
the budget; that an over-committed budget short-circuits to an empty result carrying a zeroed `Metrics`
rather than none; and that a throw becomes `WORKER_ERROR` rather than an unhandled rejection.

`utils/serializers.test.ts` covers the round trip. It is the cheaper place to catch a new `Date` field than a
worker test is.

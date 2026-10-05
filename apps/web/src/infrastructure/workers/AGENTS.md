# apps/web/src/infrastructure/workers

## Purpose

The browser Web Worker that runs the planning pipeline off the main thread. The planner computes everything
client-side ([ADR 0001](../../../../../adr/0001-planner-runs-in-the-browser.md)), so a full run (suggestions,
alternatives and metrics for each of them) is the one piece of work in the app long enough to freeze a
slider drag if it stayed on the main thread.

This is a **Web Worker**, not a Cloudflare Worker. Nothing in this folder runs on the server, and the
Cloudflare Worker that hosts the app is configured in `wrangler.toml`, not here.

## Files

**This folder holds no planning rule.** [`worker.ts`](./worker.ts) deserialises a request, calls `runPlanningPipeline` from
`@domain/calendar`, serialises the result and posts it. The caches, the `manual-N` pseudo-Holidays, the budget,
the short circuits and the Metrics all live in that module, which the holidays store calls too. A rule you want
to change is in the domain; what lives here is the boundary.

| File | Contents |
| --- | --- |
| `worker.ts` | The entry point. Registers `globalThis.onmessage`, calls the pipeline, replies with `self.postMessage` |
| [`types.ts`](./types.ts) | `WORKER_MESSAGE_TYPE`, `CalculateSuggestionsRequest`, `WorkerResponse`, `MetricsHoldNoDate`, and the `Serialized*` wire types. Every field that is a sealed union in the domain is that union here too, except the inbound `CalculateSuggestionsPayload.strategy` and `locale` (strings) and `preferredMonths` (`unknown`) |
| [`utils/serializers.ts`](./utils/serializers.ts) | Both directions of the boundary conversion, in one file so they cannot drift apart |

The other half of the contract lives outside this folder: [`useCalculationsWorker.ts`](../../ui/hooks/useCalculationsWorker.ts) under `@ui/hooks/` spawns
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

A message whose `type` is not `CALCULATE_SUGGESTIONS` is dropped without a reply; the worker is not a general
dispatcher, and adding a second message type means adding an early return, not an `else`.

The handler is wrapped end to end in `try`/`catch` and posts a `WORKER_ERROR` carrying `String(err)`, so the
main thread always gets exactly one message per request. `useCalculationsWorker.ts` still installs `onerror`
and `onmessageerror` handlers, because a worker that fails to *load* never reaches this code.

## Invariants

**This worker does not clear the calculation caches**: `runPlanningPipeline` clears them on entry
([ADR 0006](../../../../../adr/0006-caller-owned-calculation-caches.md)). The pipeline call sits inside the
handler's `try`, after the message-type guard, so a throw anywhere in a run still becomes a `WORKER_ERROR` and
an unrelated message never starts one.

**`Temporal` reaches this thread through the engine's own `temporal-polyfill` import**, so this worker is one of
the realms that import has to work in ([ADR 0005](../../../../../adr/0005-temporal-polyfill.md)).

**The way back from a string is `fromStoredInstant`**, since everything crossing this boundary was written by
this app with `toISOString()` ([`@application/shared/utils/dateIntake`](../../application/AGENTS.md)).

**Every `Date` crosses as an ISO string, in both directions.** This is not a structured-clone limitation;
structured clone carries `Date` natively. It is a choice to make the boundary an explicit, inspectable type:
`SerializedHolidayDTO`, `SerializedBridge` and `SerializedSuggestion` in `types.ts` are what both sides
agree on, and `utils/serializers.ts` is the only place that converts. Adding a `Date` field to a domain type
that crosses here means adding it to the serialiser and to the wire type, or it arrives as a string typed as a
`Date`.

**`Metrics` is the one domain type reused verbatim, and a type enforces what makes that safe.**
`types.ts` imports `Metrics` from `@domain/calendar/types` rather than mirroring it, which holds only while
`Metrics` carries no `Date`: every field is a number, a number array or a `{ first, last }` pair of strings.
Put one in and `SerializedSuggestion` claims a `Date` survives on a wire whose every sibling field was
deliberately stringified.

`MetricsHoldNoDate` in `types.ts` is that claim as a type: `DateFields<Metrics>` walks the shape, and the
assertion resolves to `true` only when it finds none. An added `measuredAt?: Date` fails **one** line
(`Type '"measuredAt"' does not satisfy the constraint 'true'`) in the file that makes the reuse, naming the
field. The `Metrics` fixtures in `serializers.test.ts` and [`worker.test.ts`](./worker.test.ts) are annotated
`Metrics`, so they fail to compile when the shape changes.

**`SerializedSuggestion.metrics` is required, not optional, and the serialisers speak `MeasuredSuggestion`.**
The pipeline measures both of its branches, so a Suggestion crossing this boundary always has Metrics; saying
so on the wire type is what lets the store hold `MeasuredSuggestion` and the planner screen stop
optional-chaining. `deserializeSuggestion` returns `MeasuredSuggestion` on that strength; it does not
check that the field is present, so a wire message genuinely missing `metrics` would arrive as a lie. Nothing
else produces these messages, which is what makes the claim safe.

**Neither direction of `serializers.ts` casts, because the wire type tells the truth.**
`SerializedHolidayDTO.variant` is `HolidayVariant` and `SerializedSuggestion.strategy` is `Strategy`: the
values on the outbound leg were produced by `serializeHolidays` and `serializeSuggestionResult` from types that
were already sealed, so a bare string in either serialiser is a compile error rather than a cast that absorbs
it. The *inbound* leg is where a value out of persisted storage arrives, so `CalculateSuggestionsPayload.strategy`
and `locale` stay `string` and `preferredMonths` stays `unknown`.

`worker.ts` is the inbound direction and parses, one predicate per untyped field: `isStrategy` from
[`@domain/calendar/types`](../../domain/calendar/types.ts) falls back to `DEFAULT_STRATEGY`, which is also
what the filters store initialises to, so the wire default and the store default cannot drift; `isLocale`
falls back to `EN`; `isPreferredMonths` falls back to an empty list, the one value the Main Vacation objective
already reads as any month, rather than a guess. The engine keeps its own fallback for an unknown Strategy,
`objectiveFor`, as depth against a caller the compiler has not checked; see
[`@domain/calendar/AGENTS.md`](../../domain/calendar/AGENTS.md). The fix belongs at the seam the untyped value
crosses, and it is one predicate at one call site: do not grow it into a validation layer over the rest of the
wire type.

## Manual and Removed Days

The worker hands the hand-edited days to the pipeline by name and folds neither into `holidays`: Manual Days as
`manualDays`, Removed Days as `removedSuggestedDays`, each deserialised with `fromStoredInstant` and
defaulting to an empty list when the request omits it. What the pipeline does with them (Manual Days as `manual-N`
pseudo-Holidays and as the streaks `findPlanningCandidates` treats as already off, Removed Days out of the
Workday list and never a Free Day) is the domain's; see the *Public API* section of
[`@domain/calendar/AGENTS.md`](../../domain/calendar/AGENTS.md); `worker.test.ts` pins that no Removed Day
reaches `holidays`.

The worker builds the Planning Window from the request's `year` and `carryOverMonths` (`window`), and the
pipeline reads the year off it, Metrics included.

## The budget, and the empty-result short circuit

Both live in `runPlanningPipeline`; the rule is in
[`@domain/calendar/AGENTS.md`](../../domain/calendar/AGENTS.md). What matters on this side is the wire: the
pipeline's `planned: false` result carries an empty Suggestion whose `metrics` are **measured by the engine**,
so `serializeSuggestionResult` has a real object to send and `currentSelection.metrics` is never `undefined`.

The consequence that remains is the stored empty plan being what the next run reads back, which is how an
emptied selection can pin the auto-suggest cap at zero. `useCalculationsWorker.ts` guards that by treating a
computed cap of `0` as "no cap".

## One worker, reused, and the latest request wins

`useCalculationsWorker.ts` spawns the worker on its first calculation and keeps it for the life of the hook,
because a fresh worker starts cold (its JIT and its cached `Intl` formatters) and every recalculation would pay
that difference. The handler in `worker.ts` is synchronous, so a reused worker cannot be preempted and
`terminate()` is the only thing that could cancel a run.

So the hook never cancels a run. A request made while one is in flight is held, and a later one replaces it,
so a burst of ten budget clicks runs the first and the last and nothing in between. When the in-flight reply
arrives it is discarded if a request is waiting, and the waiting one is posted; only the reply to the latest
request is applied. Requests are numbered by a counter rather than a timestamp, because a reused worker's
replies are told apart by their id alone. A worker that reports `error` is terminated and dropped, and the
next request, a waiting one included, spawns a fresh one.

## Testing

`worker.test.ts` stubs `self` with `vi.stubGlobal`, mocks `runPlanningPipeline`, then `await import('./worker')`
for its registration side effect; the import must come after the stubs, and the mock is `vi.hoisted` for the
same reason. Messages are driven by invoking `globalThis.onmessage` directly.

**The mock is keyed on the pipeline, not on the engine modules.** `runPlanningPipeline` holds the rules, so
reaching through it from here would restate domain behaviour inside the boundary's test. Manual Days becoming
`CUSTOM` pseudo-Holidays, Manual Days coming out of the budget, and the Metrics being sized to the Planning
Window they were given are pinned against the real engine in
[`pipeline.test.ts`](../../domain/calendar/pipeline.test.ts) instead; re-mocking the engine here would buy a
weaker copy of each and nothing else.

The remaining claim is genuinely this side's, because this side builds the array it is about: a Removed Day
reaches the pipeline as `removedSuggestedDays` and appears in `holidays` not at all. `worker.test.ts` keeps
that one, asserted against the recorded `RunPlanningPipelineParams`.

What it pins: the message-type guard, deserialisation into the pipeline's own input names, the wire
narrowings (`isStrategy`, `isLocale` and `isPreferredMonths`), serialisation of the reply, that an
unplanned result reaches the wire carrying the pipeline's own `Metrics` rather than a literal, and that a throw
becomes `WORKER_ERROR` rather than an unhandled rejection.

**The unplanned case asserts the `Metrics` *shape*, and it has to, because the values alone cannot fail it.**
A hand-written calendar year of monthly and quarterly buckets would pass a case sent with
`carryOverMonths: 0`, since a calendar year is the right answer there, while the engine sizes both to the
Planning Window. So the case sends `carryOverMonths: 3` and its fixture carries the wider bucket counts that
implies, zeroed.

An empty *Holiday* list is **not** one of the short circuits, and a test asserting it was would be wrong. A
weekend is a Free Day and a Bridge only needs one beside it, so a Holiday-free calendar plans normally. The
pipeline short-circuits on an empty candidate set instead.

The pipeline's own behaviour is pinned once, against the real engine, in
[`pipeline.test.ts`](../../domain/calendar/pipeline.test.ts), including the cache clearing, which is testable
there as behaviour (run twice, check the second run answers for its own Holidays) rather than as spy calls
in no particular order.

[`utils/serializers.test.ts`](./utils/serializers.test.ts) covers the round trip. It is the cheaper place to catch a new `Date` field than a
worker test is.

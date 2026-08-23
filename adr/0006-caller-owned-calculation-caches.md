# 6. Calculation caches are module-level and reset by the caller

Date: 2026-07-26

## Status

Amended twice.

**2026-08-16.** The second paragraph of the Context below asserted a premise that has stopped being true:
that "a run calls the suggestion generator and the alternatives generator separately, and both must see the
same memoised holiday set". They no longer see it separately. `findPlanningCandidates` under
[`utils/candidates.ts`](../apps/web/src/domain/calendar/utils/candidates.ts) enumerates the Workdays and finds the Bridges once, and `runPlanningPipeline` hands the
same candidate set to both generators — so the sharing the memoised holiday set existed to provide is now
structural, not incidental.

Two things follow, and only the first is settled. The caches are no longer what makes the two generators
agree, so the clear-on-entry rule is the only part still load-bearing: `runPlanningPipeline` still calls
`clearDateKeyCache` and `clearHolidayCache` first, and [`pipeline.test.ts`](../apps/web/src/domain/calendar/pipeline.test.ts) still pins that behaviourally by
running twice with different Holidays. Whether `HOLIDAY_CACHE` now earns its keep at all is **unsettled** —
a probe alternating cold and warm runs measured 104/67, 59/52, 49/57 and 100/47 ms, which is warm being no
faster than cold, but four iterations on one fixture is not a measurement. Deleting it needs a probe on a
deployed preview over a large Planning Window, where the memoisation would show if it ever does.

The two spy-based assertions that counted `clear` calls on the holidays store and the Web Worker are gone
with this amendment. They restated a rule that had already moved off those callers, and the behavioural
guard in `pipeline.test.ts` is strictly stronger.

**2026-08-14.** The caches stay module-level and fixed-key; what changed is who clears them. The
orchestration that both callers duplicated is now one module, `runPlanningPipeline`, and it clears on entry —
so the clear moved *inside* the run without moving inside either generator. The reasoning below stands; the
"caller" it names is now the pipeline rather than the Web Worker and the holidays store.

## Context

The bridge-detection hot path memoises date keys and the set of Holiday dates in module-level maps. Those maps are never evicted on their own, and at every production call site the holiday set is stored under a single fixed key — so a second run reuses the first run's holidays unless someone clears it.

The engine cannot clear them itself, because it has no way to know where one logical run ends and the next begins: a run calls the suggestion generator and the alternatives generator separately, and both must see the same memoised holiday set. Clearing inside either one destroys the sharing that is the entire reason the caches exist. *(Superseded by the 2026-08-16 amendment: the two generators are handed one candidate set and no longer build it separately.)*

Deriving the cache key from the holiday set instead would remove the problem outright. With two callers that is more machinery than the bug it prevents is worth; the trade-off is recorded here rather than engineered away.

**What the amendment rests on.** The original decision assumed the orchestration would keep living at each
call site, so "the caller" was the only place that knew a run had begun. That assumption is what stopped
holding: the Web Worker and the holidays store were two copies of one pipeline, kept in step by a pair of
hand-mirrored test suites, and the clear was one of the several things both had to remember. Collapsing them
gives the run an owner. `runPlanningPipeline` is not a generator — it is the thing that calls both — so it
knows exactly where a run starts, which is the knowledge the engine lacked and the callers had to supply.

## Decision

The caches stay module-level and keyed by a fixed key. `runPlanningPipeline` clears both before it does
anything else; nothing else clears them in production. Callers of the pipeline — the Web Worker and the
holidays store — pass inputs and read a result, and neither knows the caches exist.

## Consequences

- The failure mode the original decision watched for is gone: there is no third caller to forget the clear, because there is nothing left to forget. A new entry point calls the pipeline or it does not plan at all.
- Reordering the engine so a *generator* clears its own caches would still break the sharing between the two. The pipeline is above both, which is why it may.
- Tests that exercise a generator directly must still clear in setup. The `clearDateKeyCache()` / `clearHolidayCache()` pair exists for that, and the domain guide still requires it per `describe`. Tests that exercise the pipeline need no setup, because it clears for them — `pipeline.test.ts` pins that by running twice with different Holidays and checking the second run answers for its own.
- The correctness that used to depend on discipline is now structural. What still depends on discipline is the narrower rule above: a generator must not clear.

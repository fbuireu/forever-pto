# 6. Calculation caches are module-level and reset by the caller

Date: 2026-07-26

## Status

Amended three times.

**2026-08-24.** Two things below describe a mechanism that no longer exists, and the question the 2026-08-16
amendment left open is closed.

*The Holiday memo has no key.* [`utils/cache.ts`](../apps/web/src/domain/calendar/utils/cache.ts) holds it in one module-level slot,
`createHolidaySet` takes only the Holiday list, and `clearHolidayCache` is a single assignment back to
`null`. `HOLIDAY_CACHE` is not an identifier anywhere under [`apps/web/src`](../apps/web/src); the symbols are
`createHolidaySet`, `clearHolidayCache`, `getKey` and `clearDateKeyCache`. So the Decision's "keyed by a
fixed key" and the Context's rejected alternative of "deriving the cache key from the holiday set" both
argue about a key that is gone. Read them as: the memo holds one Holiday set at a time, and the caller is
what decides when that set is stale. That is the same trade-off, stated without the key.

*Keep the memo.* The 2026-08-16 amendment called its value unsettled and asked for a probe on a deployed
preview over a large Planning Window. No probe is needed, because the call graph answers it:
`createHolidaySet` has exactly two production callers, `getAvailableWorkdays` and `findBridges` in
[`utils/helpers.ts`](../apps/web/src/domain/calendar/utils/helpers.ts), and `findPlanningCandidates` calls them one after the other on the same
Holiday list. The memoisation is what makes the second call free; deleting it rebuilds the Holiday set twice
on every run. What moved was who benefits, not whether anyone does: the sharing is now inside one
`findPlanningCandidates` call rather than across the two generators, which no longer touch the memo at all.
[`../apps/web/src/domain/calendar/CLAUDE.md`](../apps/web/src/domain/calendar/CLAUDE.md) reached this
conclusion first and recorded it as an amendment to this file; this paragraph is that amendment.

**2026-08-16.** The second paragraph of the Context below asserted a premise that has stopped being true:
that "a run calls the suggestion generator and the alternatives generator separately, and both must see the
same memoised holiday set". They no longer see it separately. `findPlanningCandidates` under
[`utils/candidates.ts`](../apps/web/src/domain/calendar/utils/candidates.ts) enumerates the Workdays and finds the Bridges once, and `runPlanningPipeline` hands the
same candidate set to both generators, so the sharing the memoised holiday set existed to provide is now
structural, not incidental.

Two things follow, and only the first is settled. The caches are no longer what makes the two generators
agree, so the clear-on-entry rule is the only part still load-bearing: `runPlanningPipeline` still calls
`clearDateKeyCache` and `clearHolidayCache` first, and [`pipeline.test.ts`](../apps/web/src/domain/calendar/pipeline.test.ts) still pins that behaviourally by
running twice with different Holidays. Whether the Holiday memo now earns its keep at all is **unsettled**:
a probe alternating cold and warm runs measured 104/67, 59/52, 49/57 and 100/47 ms, which is warm being no
faster than cold, but four iterations on one fixture is not a measurement. Deleting it needs a probe on a
deployed preview over a large Planning Window, where the memoisation would show if it ever does.
*(Closed by the 2026-08-24 amendment, without the probe: `findPlanningCandidates` calls `getAvailableWorkdays`
and `findBridges` on the same Holiday list, so the memo saves one rebuild per run and stays.)*

The two spy-based assertions that counted `clear` calls on the holidays store and the Web Worker are gone
with this amendment. They restated a rule that had already moved off those callers, and the behavioural
guard in `pipeline.test.ts` is strictly stronger.

**2026-08-14.** The caches stay module-level and fixed-key; what changed is who clears them. The
orchestration that both callers duplicated is now one module, `runPlanningPipeline`, and it clears on entry,
so the clear moved *inside* the run without moving inside either generator. The reasoning below stands; the
"caller" it names is now the pipeline rather than the Web Worker and the holidays store.

## Context

The bridge-detection hot path memoises date keys and the set of Holiday dates in module-level maps. Those maps are never evicted on their own, and at every production call site the holiday set is stored under a single fixed key, so a second run reuses the first run's holidays unless someone clears it.

The engine cannot clear them itself, because it has no way to know where one logical run ends and the next begins: a run calls the suggestion generator and the alternatives generator separately, and both must see the same memoised holiday set. Clearing inside either one destroys the sharing that is the entire reason the caches exist. *(Superseded by the 2026-08-16 amendment: the two generators are handed one candidate set and no longer build it separately.)*

Deriving the cache key from the holiday set instead would remove the problem outright. With two callers that is more machinery than the bug it prevents is worth; the trade-off is recorded here rather than engineered away. *(Superseded by the 2026-08-24 amendment: the Holiday memo is one slot with no key, so there is no key left to derive. The alternative it rules out is now "make the memo hold more than one Holiday set at a time", and the answer is unchanged.)*

**What the amendment rests on.** The original decision assumed the orchestration would keep living at each
call site, so "the caller" was the only place that knew a run had begun. That assumption is what stopped
holding: the Web Worker and the holidays store were two copies of one pipeline, kept in step by a pair of
hand-mirrored test suites, and the clear was one of the several things both had to remember. Collapsing them
gives the run an owner. `runPlanningPipeline` is not a generator but the thing that calls both, so it
knows exactly where a run starts, which is the knowledge the engine lacked and the callers had to supply.

## Decision

The caches stay module-level and hold one run's worth of data: `getKey` memoises date keys in a map that is
never evicted, and `createHolidaySet` memoises the Holiday set in a single slot. `runPlanningPipeline` clears
both before it does anything else; nothing else clears them in production. Callers of the pipeline, the Web
Worker and the holidays store, pass inputs and read a result, and neither knows the caches exist.

## Consequences

- The failure mode the original decision watched for is gone: there is no third caller to forget the clear, because there is nothing left to forget. A new entry point calls the pipeline or it does not plan at all.
- Reordering the engine so a *generator* clears its own caches would still break the sharing between the two. The pipeline is above both, which is why it may.
- Tests that exercise a generator directly must still clear in setup. The `clearDateKeyCache()` / `clearHolidayCache()` pair exists for that, and the domain guide still requires it per `describe`. Tests that exercise the pipeline need no setup, because it clears for them; `pipeline.test.ts` pins that by running twice with different Holidays and checking the second run answers for its own.
- The correctness that used to depend on discipline is now structural. What still depends on discipline is the narrower rule above: a generator must not clear.
- Recorded elsewhere, and each of these is a place an amendment has been written before it reached this file:
  the Gotchas bullet in [`../apps/web/CLAUDE.md`](../apps/web/CLAUDE.md), the cache section of
  [`../apps/web/src/domain/calendar/CLAUDE.md`](../apps/web/src/domain/calendar/CLAUDE.md), the pipeline
  section of [`../apps/web/src/application/stores/CLAUDE.md`](../apps/web/src/application/stores/CLAUDE.md),
  and the invariant in [`../apps/web/src/infrastructure/workers/CLAUDE.md`](../apps/web/src/infrastructure/workers/CLAUDE.md).
  A guide that says it amends this ADR while this ADR says nothing about the amendment is the failure mode
  [`../tests/docs-consistency.test.ts`](../tests/docs-consistency.test.ts) now watches for.

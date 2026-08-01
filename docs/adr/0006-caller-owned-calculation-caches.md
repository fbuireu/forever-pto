# 6. Calculation caches are module-level and reset by the caller

Date: 2026-07-26

## Status

Accepted.

## Context

The bridge-detection hot path memoises date keys and the set of Holiday dates in module-level maps. Those maps are never evicted on their own, and at every production call site the holiday set is stored under a single fixed key — so a second run reuses the first run's holidays unless someone clears it.

The engine cannot clear them itself, because it has no way to know where one logical run ends and the next begins: a run calls the suggestion generator and the alternatives generator separately, and both must see the same memoised holiday set. Clearing inside either one destroys the sharing that is the entire reason the caches exist.

Deriving the cache key from the holiday set instead would remove the problem outright. With two callers that is more machinery than the bug it prevents is worth; the trade-off is recorded here rather than engineered away.

## Decision

The caches stay module-level and keyed by a fixed key, and clearing them is the caller's job. Every caller that starts a full calculation clears both caches first. There are exactly two: the Web Worker, and the holidays store on the main thread.

## Consequences

- Adding a third caller without clearing produces silently wrong Suggestions rather than an error, because the stale holiday set is structurally valid. This is the failure mode to watch for, and nothing detects it automatically.
- Reordering the engine so it clears its own caches would break the sharing between the two generators.
- Tests that exercise the engine must clear in setup for the same reason. The `clearDateKeyCache()` / `clearHolidayCache()` pair exists for that.
- Correctness here depends on discipline, and the discipline is documented in the layer guides rather than enforced.

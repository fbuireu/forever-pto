# apps/web/src/domain/calendar

## Purpose

The planning engine. Given a Planning Window, a set of Holidays and a PTO budget, it finds the Bridges that
turn that budget into the longest stretches away from work, picks a set of them under the chosen Strategy,
offers Alternatives, and measures the result. Pure functions throughout: same inputs, same output, no
clock beyond `startOfToday()`, no I/O. The layer contract it sits under is in [`../AGENTS.md`](../AGENTS.md)
([ADR 0003](../../../../../adr/0003-pure-calendar-domain-effectful-payment-domain.md)); the words it uses are
in [`CONTEXT.md`](../../../../../CONTEXT.md).

## Files

| File | Contents |
| --- | --- |
| [`types.ts`](./types.ts) | `Bridge`, `Suggestion`, `MeasuredSuggestion`, `Metrics`, `FirstLastBreak`, the `FilterStrategy` const object plus its type, and the pair that guards the wire: `isFilterStrategy` and `DEFAULT_FILTER_STRATEGY`. It imports nothing, because the docs site reads it by relative path |
| [`const.ts`](./const.ts) | `PTO_CONSTANTS`: every tunable in the engine; the unit and meaning of each are in [Constants](#constants) below. It imports nothing either: the docs site reads it by relative path too |
| [`utils/cache.ts`](./utils/cache.ts) | `getKey`, `getCombinationKey`, `createHolidaySet`, and the two `clear*` functions `runPlanningPipeline` opens with |
| [`utils/helpers.ts`](./utils/helpers.ts) | `getAvailableWorkdays` (Workday enumeration), `findBridges` (candidate generation, sorted into the tie-break order `compareByEfficiency` defines) and `freeDaysAround` (the Free Days each Manual Day leans on, which become `alreadyOff`) |
| [`utils/candidates.ts`](./utils/candidates.ts) | `findPlanningCandidates`: the Workdays, the Bridges, the Manual Days and their streaks (`alreadyOff`), found once per run and handed to both generators, and `selectionInputOf`, the one construction of what a selector run is given |
| [`utils/selection.ts`](./utils/selection.ts) | `resolveSelectedDays`: folds Manual Days in and Removed Days out of a Suggestion's day list |
| [`utils/budget.ts`](./utils/budget.ts) | `measureBudget`: how much of the PTO budget a plan has spent, and the Remaining Budget; `measureGain`: Gain, against the whole budget |
| [`suggestions/generateSuggestions.ts`](./suggestions/generateSuggestions.ts) | The greedy plan: the chosen Strategy's selector run once over the candidates, which the Alternatives search starts from |
| [`suggestions/utils/selectors.ts`](./suggestions/utils/selectors.ts) | `STRATEGY_OBJECTIVE` (one `Objective` per Strategy: a marginal floor, a rank and an aim), `objectiveFor` (the one fallback), `selectBridges`, the single selector they all feed and the one owner of the chronological day order, `selectBridgesForStrategy` which composes them, and `outranks`, the one lexicographic comparison of ranks, which the Alternatives search reuses. It counts days with `dayIndex` from `@application/shared/utils/dates` |
| [`utils/stretches.ts`](./utils/stretches.ts) | `workStretchesOf` and `longestWorkStretch`: Workdays grouped into stretches of work that only a Free Day on a weekday ends, the one reading of the rule the selector and `measurePlan` share |
| [`utils/spans.ts`](./utils/spans.ts) | `DaySpan`, a closed range of day indexes, and `spanLength`, its length in days: the one spelling of `end - start + 1` the selector, the stretches and the Bridge search share |
| [`utils/measures.ts`](./utils/measures.ts) | `measurePlan` and `PlanMeasures`: the facts an `aim` ranks a whole plan by, and the Effective Days and Efficiency the Alternatives are capped with, counted the way the Metrics count them |
| [`window.ts`](./window.ts) | `PlanningWindow` and both of its projections, `planningWindowMonths` (the month array) and `planningWindowInterval`/`isInPlanningWindow` (the interval), plus `MONTHS_IN_YEAR`, `MONTHS_IN_QUARTER`, `MAX_CARRY_OVER_MONTHS`, `windowMonthCount`/`windowQuarterCount`, and the Preferred Months: `isPreferredMonths` with `DEFAULT_PREFERRED_MONTHS`, `reachableMonths` and `reachablePreferredMonths`, the window positions that can still take a PTO Day, `monthKeyOf` and `preferredMonthKeys`, the absolute month keys the engine compares, and `inPreferredMonths`, the one reading of "every month is preferred, and none chosen means any" that the selector and `measurePlan` share, kept here rather than in `types.ts` because the docs site imports `types.ts` by relative path and it must stay import-free |
| [`pipeline.ts`](./pipeline.ts) | `runPlanningPipeline`, the whole run: caches, pseudo-Holidays, budget, the planning calls and the Metrics |
| [`alternatives/generateAlternatives.ts`](./alternatives/generateAlternatives.ts) | Re-runs selection under the other Strategies and without one Rest Block of the Suggestion at a time, keeping plans at least `MIN_DIFFERENCE` apart |
| [`alternatives/utils/helpers.ts`](./alternatives/utils/helpers.ts) | `planDistance`: one minus the Jaccard index of two day sets |
| [`metrics/generateMetrics.ts`](./metrics/generateMetrics.ts) | Assembles the `Metrics` object for a Suggestion or an Alternative |
| [`metrics/utils/dayOff.ts`](./metrics/utils/dayOff.ts) | `dayKey` and `dayOffKeys`: the metrics' spelling of a day's identity, and the set of placed days and Holidays that the streaks, Max Work Streak and Worked Days per month count against |
| [`metrics/utils/streaks.ts`](./metrics/utils/streaks.ts) | `freeStreaks`: the one scan of the free-day runs the plan produces |
| [`metrics/utils/helpers.ts`](./metrics/utils/helpers.ts) | One function per metric (Effective Days, Long Weekends, Long Blocks per Quarter, Rest Blocks, Max Work Streak, Longest Vacation, Worked Days per month, the first and last months, quarterly and monthly distribution) plus `windowMonthIndex`, which places a date in one of the buckets `window.ts` sizes and which `YearTimelineChart.tsx` reads too, `restBlocksOf`, the one owner of the Rest Block separation rule, and `getBridgesInUse` |

## Public API

**`runPlanningPipeline` is the entry point the outside world calls.** One function, one input object, one
result:

```
runPlanningPipeline({ window, ptoDays, autoSuggestCount?, holidays, manuallySelectedDays?,
                      removedSuggestedDays?, allowPastDays, strategy, preferredMonths?, locale, maxAlternatives })
  → { planned, suggestion, alternatives }
```

It owns everything a run needs: clearing both caches, turning Manual Days into `manual-N` pseudo-Holidays,
expanding the Planning Window into months, narrowing the Preferred Months to the ones the window can still
reach, computing `effectivePtoDays`, short-circuiting when there is no budget or no candidate to spend it on,
and measuring the Suggestion and every Alternative with the same arguments. `planned: false` is the short
circuit: the suggestion it carries is empty but its Metrics are real, measured by the engine, so no caller has
to invent a zeroed object.

**`PlanningResult` is a discriminated union, and everything in it is a `MeasuredSuggestion`.** `Suggestion`
declares `metrics?` because the generators produce one without Metrics; this pipeline never does, on
either branch. Saying so in the type is what lets the stores and the whole planner screen read
`suggestion.metrics.totalEffectiveDays` rather than `metrics?.x ?? 0`, where a genuine regression would show
as a silent zero instead of a type error. `MeasuredSuggestion` is `Suggestion & { metrics: Metrics }` and it
travels: the worker's wire type requires `metrics`, `deserializeSuggestion` returns one, and `HolidaysState`
holds them. The one place that has to earn it is rehydration: `onRehydrateStorage` drops a persisted
Suggestion with no Metrics rather than pretending, because a stored blob is the only input the type cannot
vouch for.

The generators below are exported and tested on their own, but nothing outside the domain calls them
directly:

- `generateSuggestions({ ptoDays, candidates, strategy, preferredMonths? })` → `{ days, bridges, strategy }`, the greedy plan the search starts from
- `generateAlternatives({ ptoDays, candidates, maxAlternatives, existingSuggestion, strategy, preferredMonths? })` → `{ suggestion, alternatives }`, the best plan the chosen Strategy found and the ones offered beside it
- `generateMetrics({ suggestion, locale, planningWindow, holidays, allowPastDays, manuallySelectedDays, removedSuggestedDays })` → `Metrics`

**Outside the domain, the app reads `runPlanningPipeline` (the worker and the holidays store), `generateMetrics`
(the holidays store), `measureBudget`, `measureGain`, `resolveSelectedDays`, `windowMonthIndex`, the types and the
Planning Window helpers.** Everything else under `utils/`, `suggestions/`, `alternatives/` and `metrics/` is
internal.

**`measureBudget` is the one place the budget arithmetic lives, and it is built on `resolveSelectedDays` so it
cannot disagree with the Metrics.** It answers `{ suggested, manual, spent, remaining }` for a budget and a
plan; `spent` is exactly `resolveSelectedDays(...).length`, which is the same denominator Efficiency uses, and
`remaining` is the Remaining Budget as [`CONTEXT.md`](../../../../../CONTEXT.md) defines it, clamped at zero.
`toggleDaySelection`, `PlannerPanel`'s status readout and the sidebar's budget control all route through it.

**`resolveSelectedDays` is applied twice, on purpose.** `generateMetrics` applies it to its own input, and
`usePlacedPlan` in [`usePlanReadout.ts`](../../ui/hooks/usePlanReadout.ts) applies it again, so the Summary and
the calendar export read exactly the days the Metrics were computed from. It matches on `toDateString()`, so a
`Date` carrying a time component still lines up, and it returns the original array unchanged when there are no
Manual or Removed Days.

**`generateMetrics` requires both `manuallySelectedDays` and `removedSuggestedDays`, and neither defaults.** A
caller that omitted them would get Metrics measured against the days the engine placed *by itself*, while the
streaks run straight through the Manual Days, which the pseudo-Holidays make Free Days: Efficiency
(`totalEffectiveDays / days.length`), Bonus Days (`totalEffectiveDays - days.length`) and the monthly and
quarterly distributions would all be inflated by every Manual Day a stretch covers. `runPlanningPipeline`
defaults both to `[]` for a run with no hand edits and hands them to every measure, which
[`pipeline.test.ts`](./pipeline.test.ts) pins.

**The short circuit is no budget or an empty candidate set, never an empty Holiday list.** `findBridges` asks
`isWeekendIndex(day) || holidayDays.has(day)` of each neighbour, so a weekend is a Free Day and a Bridge needs
nothing else beside it. With no Holidays at all a Friday still expands into Saturday and Sunday for three
Effective Days at 3.0, and a Thursday-Friday pair reaches Sunday at 4/2, exactly `EFFICIENCY.MINIMUM`. The
pipeline returns `planned: false` for no budget, computes `findPlanningCandidates`, and returns it again when
`candidates.bridges` is empty, which is the condition the rest of the run genuinely cannot proceed without. A
Holiday-free calendar does reach it: the Troubleshooting reset calls the store's `generateSuggestions`, and
`fetchHolidays`'s catch leaves only the Custom Holidays, which a reset empties.

**Each candidate `findBridges` emits already has a distinct PTO-day set, so there is no dedupe pass.** It
emits, per starting Workday W, exactly `{W}` and the runs `{W … W+k}` for every size from
`MIN_MULTI_DAY_SIZE` up to `MAX_MULTI_DAY_SIZE`: a different minimum element across different W, a different
cardinality within one W, so `getCombinationKey` can never collide. The property is real but conditional: it
holds only while `BRIDGE_SEARCH.MIN_MULTI_DAY_SIZE` is above 1, because at 1 the size loop re-emits `{W}` a
second time. [`utils/helpers.test.ts`](./utils/helpers.test.ts) asserts that constant directly beside the
uniqueness case, and both go red together when it is lowered.

**The Planning Window is a year and a Carry-over count, and `window.ts` is where they become months.**
`PlanningWindow` is `{ year, carryOverMonths }` (the glossary term), and `planningWindowMonths` expands it.
`runPlanningPipeline` takes the window and expands it itself, so no caller hands in a month array that could
disagree with the year beside it. [`window.test.ts`](./window.test.ts) pins that the expansion and
`windowMonthCount` agree.

**The window has a second projection, and it lives here too.** `planningWindowInterval` turns the same
`{ year, carryOverMonths }` into `{ start, end }`, and `isInPlanningWindow` tests a date against it.
`planningWindowInterval(w).end` and `endOfMonth(planningWindowMonths(w).at(-1))` describe the same last day
only because `addMonths` on 31 December constrains the day to the shorter month's end. That is Temporal's
overflow behaviour doing the work, not a shared definition; `window.test.ts` asserts both ends agree at every
`carryOverMonths` the slider allows.

**`MAX_CARRY_OVER_MONTHS` is a domain bound, not a slider setting.** The Holiday source fetches `year` and
`year + 1` and nothing else, so a Planning Window wider than `MAX_CARRY_OVER_MONTHS` enumerates months whose
Holiday set is provably empty and scores every Bridge there against a blank calendar, silently, with no
error and a wrong plan. It is declared here; [`../../application/stores/filters.ts`](../../application/stores/filters.ts)
imports it as its clamp ceiling and `holidayDTO.create` derives its keep window from
`planningWindowInterval({ year, carryOverMonths: MAX_CARRY_OVER_MONTHS })`, so they cannot part company.
`window.test.ts` pins that the widest window still ends inside `year + 1`.

**`generateMetrics` takes the `PlanningWindow` whole**, so a caller cannot hand it a `year` and a
`carryOverMonths` that disagree, and every bucketed metric is sized from the window the plan was made for.

**It reads the Bridges off the Suggestion it is handed**, so `bridgesUsed` is always measured against the
Bridges of the days being measured, which is the pairing `getBridgesInUse` exists to keep together.

## The pipeline, in order

1. `findPlanningCandidates` hands every Holiday to `createHolidaySet`, which drops the ones that fall on a
   weekend, already a Free Day. It also expands every Manual Day through the Free Days around it into
   `alreadyOff`, the days the plan has before it takes a single Bridge.
2. `getAvailableWorkdays` walks each month of the expanded window day by day and keeps the Workdays: not
   a weekend, not a Holiday, not one of `removedDays`, and (unless `allowPastDays`) not before today. It has
   no other notion of range, and a duplicated month would yield duplicated Workdays, which is why the
   expansion has one owner, `runPlanningPipeline`.
3. `findBridges` generates candidates of one up to `MAX_MULTI_DAY_SIZE` consecutive Workdays, a whole working
   week, expands each candidate outwards through the Free Days on either side, computes
   `effectiveDays / ptoDaysNeeded`, and keeps the candidate only if that ratio reaches `EFFICIENCY.BLOCK_MINIMUM`.
   Every candidate it emits already has a distinct PTO-day set, for the reason in the Public API section above.
   The result is sorted by Efficiency, with differences under `EFFICIENCY_COMPARISON_THRESHOLD` treated as a tie
   and broken by `effectiveDays`; that order is not a ranking, only the last tie-break every objective falls
   back to.
4. `selectBridges` builds the plan one Bridge at a time: at every step it ranks each remaining candidate by
   what it adds to the days the plan already covers and takes the best one under the Strategy's `Objective`.
5. `generateAlternatives` searches for other plans and hands back the best one the chosen Strategy found as the
   Suggestion, with the Alternatives beside it.
6. `generateMetrics` measures the outcome, separately, from the day list, not from the selector.

## Strategies

A Strategy is an `Objective` ([ADR 0020](../../../../../adr/0020-strategies-are-objectives-over-the-marginal-gain.md)):
a **floor** on the marginal gain and a **rank**, both applied to a `Candidate` measured against the plan built so
far, and an **aim**, which ranks a whole plan by its `PlanMeasures`. The marginal gain is the days a Bridge's span
adds to what the plan already covers, divided by its PTO Days.

| Strategy | Floor | Rank, most significant first |
| --- | --- | --- |
| `OPTIMIZED` | `MINIMUM` | Marginal gain, then the length of the stretch off it ends up in, then distance from the stretches already taken |
| `GROUPED` | `BLOCK_MINIMUM` | Stretch length, counted up to `GROUPED_MAX_BLOCK_DAYS` and against it past that, then marginal gain, then distance |
| `BALANCED` | `MINIMUM` | The longest stretch of work left in the Planning Window, then the relief it brings to the stretch it splits per PTO Day, then stretch length as `GROUPED` counts it with `BALANCED_MAX_BLOCK_DAYS`, then marginal gain, then distance |
| `MAIN_VACATION` | `BLOCK_MINIMUM`, then `MINIMUM` | Two stages. First, only Bridges in the Preferred Months that start or join the one block, up to `MAIN_VACATION_BLOCK_DAYS`, ranked by block length, then marginal gain, then distance; then exactly `OPTIMIZED` |

**An `Objective` may carry `admits` and `next`, and `MAIN_VACATION` is why.** `admits` filters the candidates a
stage may consider at all, where the rank only orders them; `next` is the stage that takes over when the current
one has nothing left to take (not `then`, which Biome refuses because it would make the object a thenable).
`selectBridges` walks the chain in one run, sharing the covered set, the spent budget and the incremental facts,
so the second stage sees the block the first one built and measures every candidate against it. A single `rank`
cannot express Main Vacation: "only this block, and only up to this length" is a hard admission rule, and putting
it in the rank would let a better Bridge outside the Preferred Months win the first pick. The first stage
recognises the block through two `Candidate` facts, `planIsEmpty` (nothing is taken yet, so any admissible Bridge
may start it) and `joinsBlock` (`runLength` above the span's days no taken Bridge covers yet, which is true
exactly when the span touches or overlaps a covered day).

**`inPreferredMonths` asks whether every PTO Day of a Bridge falls in the Preferred Months, and an empty list
means every month.** It is computed once per candidate from `preferredMonths` on `selectBridges`, which the
pipeline takes from the filters store through the worker; every other Strategy receives it and ignores it,
which `selectors.test.ts` pins, so a user's months change nothing unless Main Vacation is chosen, apart from the
Main Vacation plan offered among the Alternatives.

**A Preferred Month is a position in the Planning Window, not a month of the year.** `0` is January of the
chosen year and `12` the first Carry-over Month, January of the next, so the two are different choices and the
picker shows each once, in order, grouped under a heading per year when the window spans two. Positions `0` to
`11` are the chosen year's months, so a choice stored before the Carry-over Months counted keeps its meaning,
and changing the year keeps "July" as July of the new one. `runPlanningPipeline` turns positions into absolute
month keys once, `preferredMonthKeys`, and the selector and `measurePlan` compare them with `monthKeyOf` of
each placed day; a position past the end of a shorter window matches no day.

**A Preferred Month the window can no longer reach counts as not chosen.** With `allowPastDays` off, a month
of the Planning Window that ended before today has no Workday left to place, so `runPlanningPipeline` passes
the selector only `reachablePreferredMonths`: the positions `reachableMonths` still finds in the window from
the current month on. When every chosen month has passed, that leaves none chosen, so Main Vacation still builds
its block wherever it can be longest instead of falling straight to its Optimized stage. Both month pickers
take the same set and disable the rest, keeping the stored choice so it returns when past days are allowed;
`pipeline.test.ts` pins the pruning.

Ranks compare lexicographically within `SELECTION.RANK_TOLERANCE`, because the gain is a float division. A tie on every key falls
to the order `findBridges` handed over, and only then.

**The marginal gain counts a shared Free Day once, and a sorted list cannot express it.** A Friday and the
Monday after it are each worth three days for one alone, but together they pay for one weekend: measured against
what is covered, the Monday adds one day, falls under the floor and stays out. A sort is computed before the
first pick, so no per-Strategy sort key can express it; that is the alternative the ADR rejects.

**Stretch length is the length after the Bridge is added, and a cap that is passed costs a point per day.**
`cappedRun` answers `min(runLength, cap) − max(0, runLength − cap)`. Plain `min` would let Grouped keep growing
one block through the whole budget, because a 30-day block would still score the cap and win the tie on marginal
gain against starting a second one. The penalty is what usually makes the next week of budget open a new block;
a single candidate already past the cap can still win, so the cap is a target rather than a wall.

**Distance is what spreads ties, and it is why no Strategy clusters in January.** Every Friday and Monday of a
year is worth three for one and candidates arrive in date order, so without it ties fall to the calendar and pile
up in the first weeks, which `strategies.test.ts` pins against for Optimized. The farthest candidate from the
stretches already taken wins a tie; the first pick of a run still falls to input order, because nothing is taken
yet.

**Balanced ranks by the longest stretch of work left, and a weekend does not end a stretch.** `selectBridges` takes
the Workdays and groups them into work stretches (`workStretchesOf` in
[`utils/stretches.ts`](./utils/stretches.ts)): two Workdays belong to one stretch when only
weekend days lie between them, so a Holiday, a Manual Day or a Removed Day ends one. That is the rule
`calculateMaxWorkStreak` applies, which is why Balanced's first key is the Max Work Streak the plan would leave.
The second key is what makes it work: ranking by the maximum alone plateaus as soon as two stretches are equally
long, because no single pick lowers the maximum and every candidate ties, and the tie then goes to the longest
Bridge, which spends the budget in long blocks and leaves a long stretch of work standing. The relief a pick
brings, the stretch's length squared less its two remaining pieces squared, per PTO Day, prefers cutting the
longest stretches near their middle with single days. Over a real year Balanced then places a long weekend every
two or three weeks and leaves the shortest Max Work Streak of every Strategy, which `strategies.test.ts` pins. A
Removed Day ending a stretch is a simplification the metric does not share: it is rare, and it can only make
Balanced cut sooner.

**Grouped's floor is lower on purpose, and the search's floor is the lowest of them.** A week extending a block
adds seven days for five, 1.4, which Optimized's floor of 2 would never let through, so Grouped carries
`BLOCK_MINIMUM`. A Bridge can never add more to a plan than it is worth alone, so a candidate under the lowest floor
can never be taken by anyone, and `findBridges` prunes exactly there. `utils/helpers.test.ts` asserts
`BLOCK_MINIMUM` equals the lowest floor in `STRATEGY_OBJECTIVE`: lower a Strategy's floor without lowering the
constant and the prune silently drops what that Strategy wanted.

**The gain, the stretch length and the distance are kept up to date, not recomputed.** After each pick only the
candidates overlapping the new span need their gain again, only those touching the merged stretch need its length,
and every distance is a `min` with the new span. Recomputing all three from scratch on every step makes selection
quadratic in the budget for no change in the plan.

**`findBridges`'s own sort is still the tie-break input, and it still looks like the one line safe to delete.**
Every objective ranks the candidates itself, so dropping `bridges.sort(...)` reads as a tidy-up; it decides which
of two equal candidates is taken, and deleting it quietly reshuffles the plan.

Pinning that needs a fixture whose *emission* order differs from its sorted order, and most do not: emission
is Workday-ascending, and within one Workday the single-day candidate comes before the multi-day one, which is
usually already the efficient-first order. `helpers.test.ts` uses the Workdays 6, 7 and 10 January 2025
for it. Monday the 6th emits a single (efficiency 3, leaning on the preceding weekend) and then the 6-to-7
pair (efficiency 2); Friday the 10th emits a single (efficiency 3) after both. So emission runs 3, 2, 3 and
the sorted answer is 3, 3, 2, and the assertion is unconditional over the whole array.

**`selectBridges` returns its days chronologically, and it is the only place that promises it.** It takes Bridges
in rank order, so the days it flattens out of them are not, and it sorts once before returning;
`selectors.test.ts` pins it for every Strategy, and the generator suites pin that it survives the trip out.

**There is one fallback for an unknown Strategy value, `objectiveFor`, and both generators reach it**, so one bad
string cannot put a Suggestion of one Strategy beside Alternatives of another.
[`worker.ts`](../../infrastructure/workers/worker.ts) narrows with `isFilterStrategy` before any of this; the
fallback is depth against a caller that has not been type-checked, not an error path.

**Leaving budget unspent is a correct outcome, not a gap to fill.** The selector stops when no remaining candidate
fits, is free of used PTO Days and clears the floor. A day that adds less than the floor is worse than a day
kept, and `selectors.test.ts` pins that state deliberately. Over a real year it does not happen at ordinary
budgets: every weekend offers a Friday worth three.

## Invariants and traps

**`generateMetrics` must see exactly the Holiday list the engine planned against: the whole two-year set,
unfiltered.** It is tempting to narrow it to `isInPlanningWindow`; do not. The planning calls receive the
unfiltered list, `createHolidaySet` applies no window filter, and `findBridges` expands a Bridge's span straight
through a next-year Holiday; the selector counts that span as gain, and `getTotalEffectiveDays` measures the same
stretch from the streaks. Filtering only the *Metrics* input would shorten every streak the span was built on,
Effective Days included, so the Metrics would stop agreeing with what the selector and the Alternatives search
counted when they chose the plan: a Suggestion could measure below an Alternative it was ranked above. Whatever
the engine plans against, the Metrics measure against.

That rule leaves the Metrics seeing Holidays from outside the Planning Window, and **the placed-day test is
what stops them being counted as the plan's own work**: a stretch scores only when it contains a day the plan
actually placed, not merely any free weekday. Holidays still extend a stretch (that is what a Bridge is for),
but a run that next year's Holidays form on their own does not count. This is the standard
[`CONTEXT.md`](../../../../../CONTEXT.md) sets for Longest Vacation, *the longest stretch the plan produces*, and
it is why the rule belongs in the streak test rather than in the Holiday list the engine is handed.

**The streak metrics walk the free-day runs, and they walk them once.** `generateMetrics` calls `freeStreaks`
once and hands the `FreeStreak[]` to all of them; the helpers take the array, not the inputs to rebuild it from.

`freeStreaks` builds the placed-day set, unions it with the Holidays, scans `STREAK_SCAN_MARGIN_DAYS` either side
of the data and yields each unbroken run of Free Days with these facts attached: whether it contains a day the
plan placed, and whether it contains a weekend. Effective Days, Longest Vacation, Long Weekends and Long Blocks are
then predicates over that sequence: `hasPlacedDay` (summed for the first, maximised for the second),
`length >= LONG_WEEKEND_MINIMUM_DAYS && hasWeekend && hasPlacedDay`, and
`length >= LONG_BLOCK_MINIMUM_DAYS && hasPlacedDay` anchored on the first day inside the window.

**The set of placed days and Holidays has one owner: `dayOffKeys` in
[`metrics/utils/dayOff.ts`](./metrics/utils/dayOff.ts).** `freeStreaks`, `calculateMaxWorkStreak` and
`getWorkedDaysPerMonth` all build it there. `getWorkedDaysPerMonth` filters its inputs to the year's days outside
the weekend first and then unions them through the same helper, because a Manual Day reaches it both as a placed day and as
a pseudo-Holiday, and subtracting the two lists as independent counts would take it out twice.

`dayKey` is exported beside it and is the only spelling of `toDateString()` under `metrics/`. It names the same
day `getKey` from `utils/cache.ts` does, whatever the time of day: `getKey` only *memoises* on `Date.getTime()`,
and its string reads the year, the month and the day and nothing else. The metrics keep their own spelling
because `utils/cache.ts` needs its clear at the start of a run and nothing under `metrics/` should depend on that;
the selector and `measurePlan` count in `dayIndex`, the integer form, because spans are ranges and a range needs
arithmetic. Three spellings of one identity is the price, and every one of them ignores the time of day. **The
spellings are not independent in one place: `findBridges` turns the Holiday set back into `dayIndex` integers by
splitting `getKey`'s string, month zero-based, so a change to `getKey`'s format moves every Holiday the Bridge
search sees.**

**The distributions are bucketed by the Planning Window, not the calendar year.** `getMonthlyDist`,
`calculateQuarterDistribution` and `getLongBlocksPerQuarter` all take the window and size themselves from
it: `MONTHS_IN_YEAR + carryOverMonths` buckets for the months, and that count divided into
`MONTHS_IN_QUARTER` for the quarters. `windowMonthIndex` places a date at
`(year(date) - year) * MONTHS_IN_YEAR + month(date)`, so 5 January 2027 inside a 2026 window lands in bucket 12
rather than folding into January 2026. A date outside the window is dropped, not clamped. The arrays are therefore
variable-length, and the quarter charts index `COLOR_SCHEMES` modulo its length, since the brand colours do not cover
every bucket.

**A multi-day Bridge is consecutive *calendar* days that are all Workdays.** `findBridges` extends a run
one day index at a time and requires every step to be a Workday (`workdayAt`, the Workdays keyed by
`dayIndex`), so a Friday and the following Monday are never one two-day candidate; they surface as two separate one-day Bridges. `MAX_MULTI_DAY_SIZE` is a working week, so any Workday run between two weekends is one candidate;
anything longer is two Bridges, and the marginal gain decides whether joining them is worth it.

**Efficiency is computed after expansion, not before.** A candidate's `startDate`/`endDate` are pushed
outwards through adjacent Free Days first, capped at `SAFETY_LIMIT` steps each way; only then is
`effectiveDays / ptoDaysNeeded` taken. This is why one PTO Day can score 4.0. A candidate with no adjacent
Free Day at all is rejected outright before any of that.

**`SAFETY_LIMIT` must stay far above any real free run, because a cap that can be reached is a plan
constraint wearing a guard's clothes.** The expansion loops already stop at the first day that is neither a
weekend nor a Holiday, so the only genuine runaway is a calendar containing no Workday at all. A reachable cap
truncates real spans: a company shutdown entered as Custom Holidays over five weeks would leave the Bridge beside
it with a span shorter than the free run, and the selector would count less than the Metrics measure. Bounding by
the Planning Window instead is wrong too: a span is *meant* to expand into next year's Holidays, which is why the
Metrics see the unfiltered two-year set. The limit is set so no free run inside the fetched data can reach it, and
`utils/helpers.test.ts` expands a Bridge through a five-week shutdown.

**The generators are ranking policies over one candidate set, and the set is found once.**
`findPlanningCandidates` enumerates the Workdays and finds the Bridges; `runPlanningPipeline` calls it once
and hands the result to both. [`pipeline.test.ts`](./pipeline.test.ts) pins it: one `findBridges` call per run.

**Both generators build a selector run from `selectionInputOf`, and neither builds it by hand**, so the greedy
Suggestion `generateAlternatives` receives is made from the same inputs as its own re-runs. There is no clamp of
the budget to the Workday count: a Bridge is taken only while its PTO Days are unused, so a selection can never
exceed the distinct Workdays whatever the target says.

**`generateAlternatives` calls `selectBridges`, not `selectBridgesForStrategy`.** It needs the parameters the
Strategy entry point does not take: another Strategy's objective, and the days a run must leave out
(`forbiddenDays`).

**The search runs the other Strategies first, then takes the plan apart one Rest Block at a time.** The other
objectives over the same candidates are the most different plans the engine can make. After them, each Rest Block
of the Suggestion (`restBlocksOf`, the one owner of the Rest Block rule in
[`metrics/utils/helpers.ts`](./metrics/utils/helpers.ts), taken largest first) is forbidden and the chosen objective
re-run; every new plan found that way becomes a seed whose own blocks are forbidden in turn, breadth first. A set of
forbidden days already tried is skipped before it costs a run, and a plan already seen is dropped once its run
returns; the runs, the other Strategies' included, are bounded by `ALTERNATIVES.RUNS_PER_ALTERNATIVE` per
Alternative searched for.

**The search is sized by `ALTERNATIVES.SEARCHED`, not by how many Alternatives the caller shows.** It stops
once that many are on offer or the runs are spent, and `maxAlternatives` only cuts the list it returns. The same
search is what finds a better Suggestion, so sizing it by the caller would make the Suggestion depend on how many
Alternatives the screen displays. `strategies.test.ts` pins the same Suggestion at nought, one and four for every
Strategy.

**The Suggestion is the best plan the chosen Strategy found, not the first one.** Greedy selection is not optimal,
so a re-run with a block forbidden can land on a better plan than the one it started from. Every plan the chosen
objective produced (the greedy Suggestion and its re-runs) is ranked by the objective's `aim` over `measurePlan`,
then by Effective Days, then by Efficiency, and the leader becomes the Suggestion; the greedy plan it replaced is
offered among the Alternatives instead. The `aim` is what the Strategy is for: Effective Days for `OPTIMIZED`; the
longest stretch off for `GROUPED`, counted up to `GROUPED_MAX_BLOCK_DAYS` and against it past that, as its rank
counts it; the shortest Max Work Streak for `BALANCED`; the longest stretch off in the Preferred Months, up to
`MAIN_VACATION_BLOCK_DAYS`, for `MAIN_VACATION`. Ranking every Strategy by Effective Days would make each of them
Optimized with extra steps.

**No Alternative beats the Suggestion on Effective Days or Efficiency, and that is what makes it an alternative.**
Once the leader is known, every other plan, the other Strategies' included, is offered only when its Effective Days
and its Efficiency are both at most the Suggestion's. A re-run with more days but a worse `aim` is neither: it cannot
lead, and offering it would present more days than the recommendation. So for `OPTIMIZED` the other Strategies'
plans are usually offered, and for the others the `OPTIMIZED` plan is refused whenever it covers more days, which
over a real calendar is every time.

**The measure is exact, Manual Days included, so nothing downstream has to filter again.** `measurePlan` counts the
union of the plan's spans, its placed days and `alreadyOff`, which is exactly the free streaks the Metrics count, and
divides it by the days placed plus the Manual Days, which is the Efficiency the Metrics report. With one measure
there is one check, applied once in `generateAlternatives`, and `strategies.test.ts` pins four Alternatives, none
ahead, with Manual Days placed.

**Distinct is a distance, not disjointness.** `planDistance` is one minus the Jaccard index of two day sets, and a
plan is kept only when it is at least `ALTERNATIVES.MIN_DIFFERENCE` from the Suggestion and every plan already kept,
so an Alternative may reuse the Suggestion's best Bridges.

**Every Alternative is stamped with the Strategy that found it, not the one the user chose.** Nothing in the planner
renders a Suggestion's `strategy` except the Summary, which names the Strategy of the plan on screen, so the field is
free to say where a plan came from. The Summary's "alternatives that add more days" notice compares the plan on
screen only with the Alternatives whose `strategy` is the chosen one, so it speaks up when a hand edit, or an applied
Alternative, leaves the plan behind one of them, and never to tell a Grouped user that Optimized covers more.

**Bonus Days are measured against days placed, not the budget.** `generateMetrics` computes
`bonusDays = totalEffectiveDays − days.length` and takes no budget at all; the baseline is what the plan actually
spent.

**Gain is the budget-based twin, and it lives in `utils/budget.ts` beside `measureBudget`.** `measureGain`
answers `{ overBudget, gain }` from `totalEffectiveDays` and the whole budget, and the Summary reads it. The thing
that makes it worth naming is the denominator: Gain divides by the **budget**, Efficiency by the **days placed**, so
they coincide only when the plan spends the budget in full. [`budget.test.ts`](./utils/budget.test.ts) pins that
Gain measures against the whole budget, not the days placed.

`overBudget` is deliberately not called a Bonus Day. It is Gain's numerator measured against the budget,
which is a different quantity from the glossary's Bonus Day, and the planner guide explains why the badge
reading it says "over budget" and never the word bonus.

**Effective Days are the free streaks that contain a placed day.** `getTotalEffectiveDays` sums the length of every
`FreeStreak` with `hasPlacedDay`, the same predicate Longest Vacation takes the maximum of, so the two cannot
contradict each other: a lone Manual Day on a Friday counts three in both, and a day that is a Workday again ends
the streak by construction.

**It equals what the engine counted when it chose the plan, and that is the property to keep.** The union of the
chosen Bridges' spans and `alreadyOff` is exactly the free streaks containing the placed days, because each span
already expanded through every adjacent Free Day and `alreadyOff` is each Manual Day's own streak.
[`strategies.test.ts`](./strategies.test.ts) asserts it for every Strategy over a real calendar.

**The selector keeps the Manual Days' streaks apart from what it took.** `alreadyOff` enters a separate set that
only the gain reads: a Bridge next to a Manual Day's weekend gains nothing for that weekend, so a Friday before a
Manual Monday adds one day, not four. The covered set, the stretch length and `joinsBlock` stay about the Bridges
taken, because Main Vacation's first stage asks whether a candidate joins its block, and a Manual Day's weekend is
not the block. The `aim` does see them: `measurePlan` counts `alreadyOff`, because a whole plan is ranked by the
Longest Vacation the Metrics will show, Manual Days and all.

**Balanced's aim and the Max Work Streak metric read different ranges, and only the Carry-over Months separate
them.** The selector and `measurePlan` measure stretches over the Planning Window's available Workdays, which is
what a plan can change: Removed Days and, unless `allowPastDays`, past days are not in it. `calculateMaxWorkStreak`
scans one calendar year from the same starting point. So, the Removed Day simplification above aside, the two
agree on the year and part company only when a stretch runs on into the Carry-over Months, where the aim counts
days the metric stops at 31 December.

**`bridgesUsed` counts the Bridges still in use: those with at least one PTO Day still placed.** The streaks keep
whatever stretch the days still placed reach, so a Thursday and Friday Bridge that loses its Thursday still leads
into the weekend and still counts. `getBridgesInUse` is the filter.

**`removedDays` reaches `getAvailableWorkdays` and nothing else, on purpose.** A Removed Day is a date the
user has told us they *will work*: the planner must not place it, but it is not a Free Day. Passing it into
`createHolidaySet` (or into `findBridges`) would let the Bridge search count it as adjacent free
time and expand a Bridge through it, inflating `effectiveDays` and therefore Efficiency for every Bridge
that touches it. Dropping the date from the Workday list is the whole mechanism; there is deliberately no
second consumer.

**The metrics year is passed in, not inferred.** `generateMetrics` reads `year` off the `PlanningWindow` it is handed and passes it to
`calculateMaxWorkStreak` and `getWorkedDaysPerMonth`, which both scope themselves to one calendar year.
It cannot be derived from the plan: the Planning Window runs into the following year through the Carry-over
Months, so the first placed day may sit in `year + 1`. Nor can it come from `holidays`: that set spans both
years, may carry Custom Holidays anywhere, and is empty when there are none. For the same reason
`getWorkedDaysPerMonth` subtracts only the Holidays and PTO Days whose own year matches: the denominator is
one calendar year, and the Carry-over Months put PTO outside it.

**`allowPastDays` may only trim the metric year's own start.** `calculateMaxWorkStreak` scans from
`startOfToday()` instead of 1 January when the past is excluded, but only while today falls inside the
year. Without that clamp, planning a future year would start the scan at today and report every workday
between now and January as one uninterrupted streak.

**A Long Block counts the Free Days a Bridge absorbs, not just the PTO Days.** `getLongBlocksPerQuarter`
scans the real calendar and treats weekends and Holidays as part of the run, so a Friday plus the following
Monday is one four-day Long Block rather than two isolated PTO Days.

**A Long Block is filed under the first of its days that lies *inside* the window, not its first day.** The
scan starts `STREAK_SCAN_MARGIN_DAYS` before the earliest date, so a block can open in December of `year - 1`;
every planning year whose 1 January is a Monday or a Sunday does it, with a PTO Day on the adjacent January
workday. Anchored on its first day, such a block would get a negative `windowMonthIndex` and be dropped while
`calculateLongWeekends` counted the same stretch. `getLongBlocksPerQuarter` anchors on
`streak.days.find((day) => windowMonthIndex({ date: day, window }) >= 0)` and skips the run when that finds
nothing, so a block lying wholly outside the window is still dropped.

**`getLongBlocksPerQuarter` checks only the upper bound, and the `find` is why.** Its anchor already has a
`windowMonthIndex` of at least zero, and the floor of a non-negative over three cannot be negative. The `>= 0`
checks in `getMonthlyDist` and `calculateQuarterDistribution` are **live**: those read a raw day, not one the
`find` has already vetted.

**Rest Blocks are separated by more than `REST_BLOCK_SEPARATION_DAYS`.** Two PTO Days five days apart are one
Rest Block even with Workdays between them. Long Weekends, Longest Vacation and Long Blocks use a different rule
entirely: they scan the real calendar from `STREAK_SCAN_MARGIN_DAYS` before the first date to as many after the
last, so a stretch straddling the edge of the data is still counted whole.

**`generateMetrics` has one construction of `Metrics`, with no zero-day branch.** Every helper already answers for
an empty day list: `getMonthlyDist`, `calculateQuarterDistribution` and `getLongBlocksPerQuarter` size themselves
from the Planning Window and fill zeros, `freeStreaks` short-circuits to `[]`, `getBridgesInUse` filters
everything out, `calculateRestBlocks` and `getFirstLastBreak` have their own empty answers. Only the Efficiency
division needs a guard, because `0 / 0` is `NaN`. Max Work Streak and Worked Days per month are scoped to the
calendar year, not to the plan, so with nothing placed they are the whole year still standing, around 261 and
21.8, not 0: `CONTEXT.md` defines Max Work Streak as the longest run of Workdays *left standing after the plan is
applied*.

## The cache protocol

`utils/cache.ts` memoises date keys in a module-level map that is never evicted, and the Holiday set in a
single module-level slot. A second run therefore reuses the first run's Holidays unless someone clears it,
silently, because a stale Holiday set is structurally valid.

**The Holiday set is one slot, not a keyed cache.** `createHolidaySet(holidays)` memoises the first list it is
handed and `clearHolidayCache()` is one assignment, which reads as what it is: a memo the pipeline resets, not a
cache anyone keys into.

**`runPlanningPipeline` owns the clear, and nothing else in production calls it.** `clearDateKeyCache()` and
`clearHolidayCache()` open the pipeline. The pipeline is the right owner because it is the only code that
knows where a run begins; a `clear` anywhere below it would evict a set the same run is still using.
`worker.ts` and the holidays store's `generateSuggestions` action pass inputs and read a result; neither knows
the caches exist, and a new entry point cannot forget a step it never had
([ADR 0006](../../../../../adr/0006-caller-owned-calculation-caches.md), as amended).

**The Holiday memo earns its keep inside one `findPlanningCandidates` call.** `createHolidaySet`'s production
callers are `getAvailableWorkdays`, `findBridges` and `freeDaysAround` in `utils/helpers.ts`, and
`findPlanningCandidates` calls them one after the other on the same Holiday list; the generators do not touch it.
The memoisation is what makes the second and third calls free, and deleting it would rebuild the Holiday set
three times on every run. Keep it, and keep the clear where it is.

`fetchHolidays` replaces the Holiday set without planning, and `toggleDaySelection` recomputes Metrics, which
reach neither cache: a `clear` in either would evict a set the next run is about to rebuild anyway.

`getKey` is keyed on `Date.getTime()`, so two `Date` objects for the same day at different times of day
produce two cache entries with the same string value (harmless), but it is why every date the engine
constructs is at local midnight.

## Constants

Every tunable lives in `PTO_CONSTANTS` in `const.ts`; the one literal outside it is the `100` in `measureGain` that
turns Gain into a percentage, a unit rather than a tunable. Changing a field changes the plans users see, and the
selector tests move with it.

| Field | Value | Unit and meaning |
| --- | --- | --- |
| `SAFETY_LIMIT` | 366 | Days. The most a Bridge boundary may expand backwards or forwards through Free Days. A loop guard, and it has to be set high enough to stay one; see the trap above |
| `BRIDGE_GENERATION.EFFICIENCY_COMPARISON_THRESHOLD` | 0.1 | Efficiency ratio. Differences smaller than this count as a tie and are resolved by `effectiveDays` |
| `EFFICIENCY.MINIMUM` | 2 | Efficiency ratio. The marginal floor of `OPTIMIZED` and `BALANCED`: a Bridge is taken only while the days it adds, per PTO Day, reach this |
| `EFFICIENCY.BLOCK_MINIMUM` | 1.4 | Efficiency ratio. The marginal floor of `GROUPED`, seven days for five, and the admission floor of `findBridges`; it must stay the lowest floor any Strategy applies |
| `BRIDGE_SEARCH.MIN_MULTI_DAY_SIZE` | 2 | Consecutive Workdays. Smallest multi-day candidate tried, in addition to the single-day ones |
| `BRIDGE_SEARCH.MAX_MULTI_DAY_SIZE` | 5 | Consecutive Workdays. Largest multi-day candidate tried: a working week |
| `SELECTION.GROUPED_MAX_BLOCK_DAYS` | 16 | Days. The stretch length `GROUPED` grows a block towards, two weeks and both weekends; each day past it costs a point |
| `SELECTION.BALANCED_MAX_BLOCK_DAYS` | 9 | Days. The stretch length `BALANCED` counts towards in its third rank key, a tie-break after the work stretch and the relief; penalised past it the way `GROUPED`'s cap is |
| `SELECTION.MAIN_VACATION_BLOCK_DAYS` | 16 | Days. The longest block `MAIN_VACATION` builds in the Preferred Months; a hard admission limit, not a penalised cap |
| `SELECTION.RANK_TOLERANCE` | 1e-9 | Rank values closer than this are a tie and the next key decides; the gain is a float division |
| `ALTERNATIVES.MIN_DIFFERENCE` | 0.25 | Share of two plans' combined days they must not have in common for both to be offered |
| `ALTERNATIVES.SEARCHED` | 4 | Alternatives the search looks for, whatever the caller shows; it also sizes the search that chooses the Suggestion, so it must not follow `maxAlternatives` |
| `ALTERNATIVES.RUNS_PER_ALTERNATIVE` | 10 | Selection runs the search may spend per Alternative it looks for; bounds the cost, not the result |
| `METRICS.LONG_BLOCK_MINIMUM_DAYS` | 3 | Consecutive days. Below this a Rest Block is not a Long Block |
| `METRICS.LONG_WEEKEND_MINIMUM_DAYS` | 3 | Consecutive Free Days. The floor for a Long Weekend, which must also contain a weekend and a placed day |
| `METRICS.REST_BLOCK_SEPARATION_DAYS` | 7 | Days. Two placed days further apart than this are separate Rest Blocks. **Not the same constant** as the scan margin below: they share a value and move independently |
| `METRICS.STREAK_SCAN_MARGIN_DAYS` | 7 | Days. How far either side of the data `freeStreaks` scans, so a stretch straddling the edge is still counted whole |

## Testing

Every module has a co-located `.test.ts` except `const.ts`, a tunables object, and `utils/candidates.ts` and
`utils/spans.ts`, which the generator, selector and stretch suites exercise. Inputs are literal `Date` and
`HolidayDTO` values and assertions are on returned values; no suite replaces the engine with a mock.
`pipeline.test.ts` spies on the functions the pipeline calls and fakes the clock for one case, and
`generateSuggestions.test.ts` wraps the selector (below).

[`strategies.test.ts`](./strategies.test.ts) is the benchmark: the Spanish national calendar for 2026 and a
22-day budget through `runPlanningPipeline`, asserting what each Strategy is *for* rather than the dates it
picks. Every Strategy spends the budget and never lands under its own floor; what the selector believed it gained
equals the measured Effective Days; Optimized produces the most Effective Days, Balanced the next most with the
shortest Max Work Streak of every Strategy, and Grouped the fewest, with a longer Longest Vacation than Optimized's
and its blocks held to `GROUPED_MAX_BLOCK_DAYS`; Main Vacation's block lands in the Preferred Months before it
spends the rest like Optimized; and every plan offered is at least `MIN_DIFFERENCE` from every other.

Fixtures share January 2025 as their reference month, because its shape exercises every case by hand: Jan 3
is a Friday, Jan 4 and Jan 5 the weekend, Jan 6 to Jan 10 Monday through Friday, and the month holds 23
Workdays.

`generateSuggestions.test.ts` wraps `selectBridgesForStrategy` in a `vi.fn(actual.…)` spy rather than
replacing it, so every other case still runs the real selection while the Strategy reaching the selector stays
assertable.

A test whose subject reaches `getKey` or `createHolidaySet` calls `clearDateKeyCache()` and `clearHolidayCache()`
in `beforeEach`; `runPlanningPipeline` clears both itself, so `pipeline.test.ts` and `strategies.test.ts` need none.
Without it a case inherits the previous case's Holiday set and passes or fails for reasons that have nothing to do
with what it asserts. [`cache.test.ts`](./utils/cache.test.ts) pins that behaviour, including the case proving a
second `createHolidaySet` call ignores its new argument.

**The clears are per `describe`, not per file.** A `describe` with no `beforeEach` of its own runs against whatever
Holiday set the block above left behind, invisibly while its cases pass `holidays: []`, and the first case that
depends on its own Holidays fails with a span truncated by a set it never passed.

That covers `generateSuggestions.test.ts`, `generateAlternatives.test.ts`, `utils/helpers.test.ts` and
`utils/cache.test.ts`. The selector counts in `dayIndex` and
[`suggestions/utils/selectors.test.ts`](./suggestions/utils/selectors.test.ts) builds its Bridges by hand, so, like
[`alternatives/utils/helpers.test.ts`](./alternatives/utils/helpers.test.ts), it reaches neither cache and has no
clears. Nor does the metrics entry point: nothing under `metrics/` imports the cache module, and `generateMetrics`
reaches only `utils/selection.ts`, `window.ts` and `metrics/utils/`, none of which does. Adding a clear to any of
these would be dead code, so [`generateMetrics.test.ts`](./metrics/generateMetrics.test.ts) and
[`metrics/utils/helpers.test.ts`](./metrics/utils/helpers.test.ts) have none; do not "restore" it.

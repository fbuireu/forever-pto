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
| [`types.ts`](./types.ts) | `Bridge`, `Suggestion`, `Metrics`, `FirstLastBreak`, the `FilterStrategy` const object plus its type, and the two pairs that guard the wire: `isFilterStrategy` with `DEFAULT_FILTER_STRATEGY`, and `isPreferredMonths` with `DEFAULT_PREFERRED_MONTHS` |
| [`const.ts`](./const.ts) | `PTO_CONSTANTS`: every tunable in the engine; the unit and meaning of each are in [Constants](#constants) below |
| [`utils/cache.ts`](./utils/cache.ts) | `getKey`, `getCombinationKey`, `createHolidaySet`, and the `clear*` functions the caller must use |
| [`utils/helpers.ts`](./utils/helpers.ts) | `getAvailableWorkdays` (Workday enumeration) and `findBridges` (candidate generation and ranking) |
| [`utils/candidates.ts`](./utils/candidates.ts) | `findPlanningCandidates`: the Workdays and the Bridges, found once per run and handed to both generators |
| [`utils/selection.ts`](./utils/selection.ts) | `resolveSelectedDays`: folds Manual Days in and Removed Days out of a Suggestion's day list |
| [`utils/budget.ts`](./utils/budget.ts) | `measureBudget`: how much of the PTO budget a plan has spent, and the Remaining Budget |
| [`suggestions/generateSuggestions.ts`](./suggestions/generateSuggestions.ts) | The entry point: Workdays → Bridges → Strategy selector → Suggestion |
| [`suggestions/utils/selectors.ts`](./suggestions/utils/selectors.ts) | `STRATEGY_OBJECTIVE` (one `Objective` per Strategy: a marginal floor and a rank), `objectiveFor` (the one fallback), `selectBridges`, the single selector they all feed and the one owner of the chronological day order, and `selectBridgesForStrategy` which composes them. It counts days with `dayIndex` from `@application/shared/utils/dates` and quarters with `quarterIndex` |
| [`window.ts`](./window.ts) | `PlanningWindow` and both of its projections, `planningWindowMonths` (the month array) and `planningWindowInterval`/`isInPlanningWindow` (the interval), plus `MONTHS_IN_YEAR`, `MONTHS_IN_QUARTER`, `QUARTERS_IN_YEAR`, `MAX_CARRY_OVER_MONTHS`, `windowMonthCount`/`windowQuarterCount` and `quarterIndex`, which numbers a date's quarter continuously across years so a Carry-over quarter never folds onto the first |
| [`pipeline.ts`](./pipeline.ts) | `runPlanningPipeline`, the whole run: caches, pseudo-Holidays, budget, the planning calls and the Metrics |
| [`alternatives/generateAlternatives.ts`](./alternatives/generateAlternatives.ts) | Re-runs selection under the other Strategies and without one Rest Block of the Suggestion at a time, keeping plans at least `MIN_DIFFERENCE` apart |
| [`alternatives/utils/helpers.ts`](./alternatives/utils/helpers.ts) | `planDistance` (one minus the Jaccard index of two day sets), `coveredDays` (the days a plan's spans and placed days cover, the ceiling an Alternative may not pass) and `restBlocksOf` (a plan's Rest Blocks, largest first) |
| [`metrics/generateMetrics.ts`](./metrics/generateMetrics.ts) | Assembles the `Metrics` object for a Suggestion or an Alternative |
| [`metrics/utils/dayOff.ts`](./metrics/utils/dayOff.ts) | `dayKey` and `dayOffKeys`: the one spelling of a day's identity and of the set of days a plan leaves free, which every metric below counts against |
| [`metrics/utils/streaks.ts`](./metrics/utils/streaks.ts) | `freeStreaks`: the one scan of the free-day runs the plan produces |
| [`metrics/utils/helpers.ts`](./metrics/utils/helpers.ts) | One function per metric (Long Weekends, Rest Blocks, Max Work Streak, Longest Vacation, Worked Days per month, quarterly and monthly distribution) plus `windowMonthIndex`, which places a date in one of the buckets `window.ts` sizes |

## Public API

**`runPlanningPipeline` is the entry point the outside world calls.** One function, one input object, one
result:

```
runPlanningPipeline({ window, ptoDays, autoSuggestCount?, holidays, manuallySelectedDays?,
                      removedSuggestedDays?, allowPastDays, strategy, preferredMonths?, locale, maxAlternatives })
  → { planned, suggestion, alternatives }
```

It owns everything a run needs and a caller used to have to remember: clearing both caches, turning Manual
Days into `manual-N` pseudo-Holidays, expanding the Planning Window into months, computing
`effectivePtoDays`, short-circuiting when there is no budget or no candidate to spend it on, and measuring
the Suggestion and every Alternative with the same arguments. `planned: false` is the short circuit: the suggestion it carries is
empty but its Metrics are real, measured by the engine, so no caller has to invent a zeroed object.

**`PlanningResult` is a discriminated union, and everything in it is a `MeasuredSuggestion`.** `Suggestion`
declares `metrics?` because the generators produce one without Metrics; this pipeline never does, on
either branch. Saying so in the type is what lets the stores and the whole planner screen read
`suggestion.metrics.totalEffectiveDays` rather than `metrics?.x ?? 0`; files across the app used to guard against a
state this producer cannot be in, which turns a genuine regression into a silent zero instead of a type
error. `MeasuredSuggestion` is `Suggestion & { metrics: Metrics }` and it travels: the worker's wire type
requires `metrics`, `deserializeSuggestion` returns one, and `HolidaysState` holds them. The one place that
has to earn it is rehydration: `onRehydrateStorage` drops a persisted Suggestion with no Metrics rather
than pretending, because a stored blob is the only input the type cannot vouch for.

The generators below are still exported and still tested on their own, but nothing outside the domain
calls them directly:

- `generateSuggestions({ ptoDays, candidates, strategy })` → `{ days, bridges?, strategy }`
- `generateAlternatives({ ptoDays, candidates, maxAlternatives, existingSuggestion, strategy })` → `Suggestion[]`
- `generateMetrics({ suggestion, locale, planningWindow, holidays, allowPastDays, manuallySelectedDays, removedSuggestedDays })` → `Metrics`

**`measureBudget` is the one place the budget arithmetic lives, and it is built on `resolveSelectedDays` so it
cannot disagree with the Metrics.** It answers `{ suggested, manual, spent, remaining }` for a budget and a
plan; `spent` is exactly `resolveSelectedDays(...).length`, which is the same denominator Efficiency uses, and
`remaining` is the Remaining Budget as [`CONTEXT.md`](../../../../../CONTEXT.md) defines it, clamped at zero. That
arithmetic used to be written out at several call sites plus a copy behind a store action nothing called;
the store action was the only one with tests. `toggleDaySelection`, `PlannerPanel`'s status readout and the
sidebar's budget control all route through this now. A new caller asking "how many days are left" imports
this rather than subtracting two lengths.

`resolveSelectedDays` is the fourth export the outside world uses: `generateMetrics` applies it to its own
input, and [`CalendarExport.tsx`](../../ui/modules/sidebar/components/CalendarExport.tsx) applies it again so the exported calendar contains exactly the days the
Metrics were computed from. It matches on `toDateString()`, so a `Date` carrying a time component still
lines up, and it returns the original array unchanged when there are no Manual or Removed Days. Everything
else under `utils/` and [`suggestions/utils/`](./suggestions/utils) is internal.

**Both `manuallySelectedDays` and `removedSuggestedDays` are required, and neither defaults.** They used to
default to `[]`, and a caller that omitted them got Metrics measured against the days
the engine placed *by itself*, while `getTotalEffectiveDays` still counts Bridge spans that ran straight
through the Manual Days: the pseudo-Holidays make them Free Days for the expansion. Efficiency
(`totalEffectiveDays / days.length`) and Bonus Days (`totalEffectiveDays - days.length`) were then inflated by
every Manual Day a span covered, and so were the monthly and quarterly distributions. Both planning pipelines
omitted them once, while `toggleDaySelection` passed them, so the same unchanged plan reported different
Efficiency figures depending on which path had last written the Metrics; toggling a day on and off again was
enough to make the number jump. The mirrored blocks in [`worker.test.ts`](../../infrastructure/workers/worker.test.ts) and [`holidays.test.ts`](../../application/stores/holidays.test.ts) pin it on both
sides.

**The short circuit is the empty candidate set, and it used to be the empty Holiday list.** The guard read
`effectivePtoDays <= 0 || holidaysWithManual.length === 0`, and the second half was wrong on its own terms:
`analyzePotentialBridge` asks `isWeekend(prevDay) || holidaySet.has(...)`, so a weekend is a Free Day and a
Bridge needs nothing else beside it. With no Holidays at all a Friday still expands into Saturday and
Sunday for three Effective Days at 3.0, and a Thursday-Friday pair reaches Sunday at 4/2, exactly
`EFFICIENCY.MINIMUM`. A Holiday-free year is full of admissible Bridges, which
[`utils/helpers.test.ts`](./utils/helpers.test.ts) had already pinned one module away while
[`pipeline.test.ts`](./pipeline.test.ts) asserted the opposite rationale at the call site. The pipeline now returns
`planned: false` for no budget, computes `findPlanningCandidates`, and returns it again when
`candidates.bridges` is empty, which is the condition the rest of the run genuinely cannot proceed without.

**That fixed a defect the UI was hiding, not one users were hitting.**
[`CalendarList.tsx`](../../ui/modules/pages/planner/CalendarList.tsx) gates the Web Worker path on `canCalculate = ptoDays > 0 && holidays.length > 0 && months.length > 0`, so the normal
planner never handed the pipeline a Holiday-free calendar. The Troubleshooting reset does: it calls the
store's `generateSuggestions` with no such gate, and `fetchHolidays`'s catch sets `holidays` to the Custom
Holidays alone, which is empty after a reset. The UI gate is a second copy of the same wrong belief and is
worth removing on its own merits; it is not what made the guard correct.

**Each candidate `findBridges` emits already has a distinct PTO-day set, so there is no dedupe pass.** It
emits, per starting Workday W, exactly `{W}` and the runs `{W … W+k}` for every size up to `MAX_MULTI_DAY_SIZE`: a different minimum element across
different W, a different cardinality within one W, so `getCombinationKey` can never collide. A
`deduplicateBridges` helper sat on that hot path building a `Map` and a joined key string per candidate and
could not fire, and the test for it re-derived the key by hand and asserted the *output* was unique, which
holds whether or not the function exists. Both are gone. The property is real but conditional: it holds only
while `BRIDGE_SEARCH.MIN_MULTI_DAY_SIZE` is above 1, because at 1 the size loop re-emits `{W}` a second
time. [`utils/helpers.test.ts`](./utils/helpers.test.ts) asserts that constant directly beside the
uniqueness case, and both go red together when it is lowered, verified where the emitted keys outnumber the distinct ones.

**The Planning Window is a year and a Carry-over count, and `window.ts` is where they become months.** `PlanningWindow` is
`{ year, carryOverMonths }` (the glossary term, with the shape it has always had), and
`planningWindowMonths` expands it. `runPlanningPipeline` takes the window and expands it itself.

It used to take `year` *and* `months: Date[]`, and the round trip that produced was the finding: the UI
expanded `{ year, carryOverMonths }` with its own copy of `MONTHS_IN_YEAR`, serialised the whole month array to ISO
strings, the worker parsed them back, and the pipeline reversed the expansion with
`Math.max(0, months.length - MONTHS_IN_YEAR)` using the *domain's* copy of the same constant. Both halves
travelled, and **nothing checked they agreed**: a `year` of 2026 beside months built for 2025 would place
the plan in one year and scope Max Work Streak, Worked Days per month and every `windowMonthIndex` bucket to
the other, with no error and no way to see it. That is now unrepresentable. `serializeMonths`,
`deserializeMonths`, the UI's duplicate constant and the UI's `getTotalMonths` are all gone with it.

[`window.test.ts`](./window.test.ts) pins that the expansion and `windowMonthCount` agree, which is the property the duplicated
constants made possible to break; verified by desyncing them.

**The window has a second projection, and it lives here too.** `planningWindowInterval` turns the same
`{ year, carryOverMonths }` into `{ start, end }`, and `isInPlanningWindow` tests a date against it. They
were in [`../../application/dto/holiday/dto.ts`](../../application/dto/holiday/dto.ts), one layer up from the
month array they have to agree with, and nothing related them. `planningWindowInterval(w).end` and
`endOfMonth(planningWindowMonths(w).at(-1))` describe the same last day only because `addMonths` on 31
December constrains the day to the shorter month's end. That is Temporal's overflow behaviour doing the work,
not a shared definition. `window.test.ts` now asserts both ends agree at every `carryOverMonths` the slider
allows, verified by adding a month to one of them.

**`MAX_CARRY_OVER_MONTHS` is a domain bound, not a slider setting.** The Holiday source fetches `year` and
`year + 1` and nothing else, so a Planning Window wider than `MAX_CARRY_OVER_MONTHS` enumerates months whose
Holiday set is provably empty and scores every Bridge there against a blank calendar, silently, with no
error and a wrong plan. It sat in [`../../application/stores/filters.ts`](../../application/stores/filters.ts)
as a UI clamp while `holidayDTO.create` wrote the matching bound as a literal `year + 1`. It is declared here
now; `filters.ts` imports it as its clamp ceiling and `holidayDTO.create` derives its keep window from
`planningWindowInterval({ year, carryOverMonths: MAX_CARRY_OVER_MONTHS })`, so they cannot part company.
`window.test.ts` pins that the widest window still ends inside `year + 1`, verified by raising it to 13.

`generateMetrics` takes the `PlanningWindow` whole. It used to take `year` and `carryOverMonths` separately,
defended here on the grounds that Max Work Streak and Worked Days per month are scoped to a single calendar
year, but that is an argument for reading `window.year` inside, not for letting a caller supply the
halves independently. `carryOverMonths` was still optional and still defaulted to `0`, which is the shape the
inputs beside it were made required to escape: omit it for a 15-month window and every bucketed metric is
built at 12 months and 4 quarters, `windowMonthIndex` silently drops every Carry-over Month date, and nothing
errors. Both production callers already had the window in hand.

**It reads the Bridges off the Suggestion it was handed, and no longer takes them beside it.** The interface
used to take a whole `Suggestion` *and* a separate `bridges` array, then read `days` from one and `bridges`
from the other and never `suggestion.bridges`. Both production callers passed the same object's own field
straight back in, and nothing stopped them disagreeing: `bridgesUsed` could be
measured against Bridges that did not belong to the days being measured, which is the precise pairing
`getValidBridges` exists to keep together. One fixture in the test file was already built that way, a
`suggestion` with no `bridges` beside a top-level `bridges`. That fixture no longer compiles, which is the
point.

## The pipeline, in order

1. `generateSuggestions` drops Holidays that fall on a weekend. They are already Free Days, and keeping
   them would let a Bridge claim credit for absorbing a Saturday.
2. `getAvailableWorkdays` walks each month of the expanded window day by day and keeps the Workdays: not
   a weekend, not a Holiday, not one of `removedDays`, and (unless `allowPastDays`) not before today. It has
   no other notion of range, and a duplicated month would yield duplicated Workdays, which is why the
   expansion has one owner and callers no longer hand one in.
3. `findBridges` generates candidates of one up to `MAX_MULTI_DAY_SIZE` consecutive Workdays, a whole working
   week, expands each candidate outwards through the Free Days on either side, computes
   `effectiveDays / ptoDaysNeeded`, and keeps the candidate only if that ratio reaches `EFFICIENCY.BLOCK_MINIMUM`.
   Every candidate it emits already has a distinct PTO-day set, for the reason in the trap below. The result is
   sorted by Efficiency, with differences under `EFFICIENCY_COMPARISON_THRESHOLD` treated as a tie and broken by
   `effectiveDays`; that order is no longer a ranking, only the last tie-break every objective falls back to.
4. `selectBridges` builds the plan one Bridge at a time: at every step it re-measures each candidate against the
   days the plan already covers and takes the best one under the Strategy's `Objective`.
5. `generateMetrics` measures the outcome, separately, from the day list, not from the selector.

## Strategies

A Strategy is an `Objective` ([ADR 0020](../../../../../adr/0020-strategies-are-objectives-over-the-marginal-gain.md)):
a **floor** on the marginal gain and a **rank**, both read from a `Candidate` measured against the plan built so
far. The marginal gain is the days a Bridge's span adds to what the plan already covers, divided by its PTO Days.

| Strategy | Floor | Rank, most significant first |
| --- | --- | --- |
| `OPTIMIZED` | `MINIMUM` | Marginal gain, then the length of the break it ends up in, then distance from the breaks already taken |
| `GROUPED` | `BLOCK_MINIMUM` | Break length capped at `GROUPED_MAX_BLOCK_DAYS`, then marginal gain, then distance |
| `BALANCED` | `MINIMUM` | Inside its quarter's share of the budget, then break length capped at `BALANCED_MAX_BLOCK_DAYS`, then marginal gain, then distance |
| `MAIN_VACATION` | `BLOCK_MINIMUM`, then `MINIMUM` | Two stages. First, only Bridges in the Preferred Months that start or join the one block, up to `MAIN_VACATION_BLOCK_DAYS`, ranked by block length, then marginal gain, then distance; then exactly `OPTIMIZED` |

**An `Objective` may carry `admits` and `next`, and `MAIN_VACATION` is why.** `admits` filters the candidates a
stage may consider at all, where the rank only orders them; `next` is the stage that takes over when the current
one has nothing left to take (not `then`, which Biome refuses because it would make the object a thenable). `selectBridges` walks the chain in one run, sharing the covered set, the spent
budget and the incremental facts, so the second stage sees the block the first one built and measures every
candidate against it. A single `rank` cannot express Main Vacation: "only this block, and only up to this
length" is a hard admission rule, and putting it in the rank would let a better Bridge outside the Preferred
Months win the first pick. The first stage recognises the block through two `Candidate` facts, `planIsEmpty`
(nothing is taken yet, so any admissible Bridge may start it) and `joinsBreak` (`runLength > newDays`, which is
true exactly when the span touches or overlaps a covered day).

**`inPreferredMonths` asks whether every PTO Day of a Bridge falls in the Preferred Months, and an empty list
means every month.** It is computed once per candidate from `preferredMonths` on `selectBridges`, which the
pipeline takes from the filters store through the worker; every other Strategy receives it and ignores it,
which `selectors.test.ts` pins, so a user's months change nothing unless Main Vacation is chosen, apart from the
Main Vacation plan offered among the Alternatives.

Ranks compare lexicographically within `SELECTION.RANK_TOLERANCE`, because the gain is a float division. A tie on every key falls
to the order `findBridges` handed over, and only then.

**The marginal gain is the fix, and a sorted list cannot express it.** The walk this replaced ranked each Bridge by
the Efficiency it had alone, so a Friday and the Monday after it were each three days for one and together paid
for their weekend twice: Optimized believed 80 Effective Days where the calendar held 55. Measured against what
is covered, the Monday adds one day, falls under the floor and stays out. A sort is computed before the first
pick, so no per-Strategy key could have fixed this; that is the alternative the ADR rejects.

**Break length is the length after the Bridge is added, capped, and a cap that is passed costs a point per day.**
`cappedRun` answers `min(runLength, cap) − max(0, runLength − cap)`. Plain `min` was tried first and let Grouped keep growing
one block through the whole budget, because a 30-day block still scored the cap and won the tie on marginal gain
against starting a second one. The penalty is what makes the next week of budget open a new block.

**Distance is what spreads ties, and it is why no Strategy clusters in January.** Every Friday and Monday of a
year is worth three for one, candidates are emitted in date order and the old sort was stable, so ties fell to
the calendar and Optimized spent ten of 22 days before mid-February. The farthest candidate from the breaks
already taken wins a tie now; the first pick of a run still falls to input order, because nothing is taken yet.

**Balanced's quarter share is a strict first key, and it counts a Bridge's quarter by its first PTO Day.** The quota
is the budget divided by the number of quarters the candidates cover, rounded up. A Bridge straddling a quarter
boundary is charged whole to the quarter it starts in, so `quarterDist`, which counts days, can show a quarter
one or two over its share. That is the price of keeping a Bridge indivisible, not a defect.

**Grouped's floor is lower on purpose, and the search's floor is the lowest of them.** A week extending a block
adds seven days for five, 1.4, which Optimized's floor of 2 would never let through, so Grouped carries
`BLOCK_MINIMUM`. A Bridge can never add more to a plan than it is worth alone, so a candidate under the lowest floor
can never be taken by anyone, and `findBridges` prunes exactly there. `utils/helpers.test.ts` asserts
`BLOCK_MINIMUM` equals the lowest floor in `STRATEGY_OBJECTIVE`: lower a Strategy's floor without lowering the
constant and the prune silently drops what that Strategy wanted.

**The gain, the break length and the distance are kept up to date, not recomputed.** After each pick only the
candidates overlapping the new span need their gain again, only those touching the merged break need its length,
and every distance is a `min` with the new span. Recomputing all three from scratch on every step made selection
quadratic in the budget for no change in the plan; that is the regression to watch for if a new rank key needs a
fact about the plan.

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
in rank order, so the days it flattens out of them are not, and it sorts once before returning. A caller that
sorts the result again is hiding where the guarantee lives; `selectors.test.ts` pins it for every Strategy, and
the generator suites pin that it survives the trip out.

**There is one fallback for an unknown Strategy value, `objectiveFor`, and both generators reach it.** They used to
disagree, a Grouped Suggestion beside Balanced Alternatives for one bad string. [`worker.ts`](../../infrastructure/workers/worker.ts)
narrows with `isFilterStrategy` before any of this; the fallback is depth against a caller that has not been
type-checked, not an error path.

**Leaving budget unspent is a correct outcome, not a gap to fill.** The selector stops when no remaining candidate
fits, is free of used PTO Days and clears the floor. A day that adds less than the floor is worse than a day
kept, and `selectors.test.ts` pins that state deliberately. Over a real year it does not happen at ordinary
budgets: every weekend offers a Friday worth three.

## Invariants and traps

**`generateMetrics` must see exactly the Holiday list the engine planned against: the whole two-year set,
unfiltered.** It is tempting to narrow it to `isInPlanningWindow`, and that was tried and reverted. The
planning calls receive the unfiltered list, `createHolidaySet` applies no window filter, and
`analyzePotentialBridge` expands a Bridge's span straight through a next-year Holiday; the selector counts that
span as gain, and `getTotalEffectiveDays` measures the same stretch from the streaks. Filtering only the *Metrics* input leaves Longest Vacation, Long Weekends
and Long Blocks scanning a calendar missing the very day the span was built on, so they contradict Effective
Days inside the same Metrics object. Whatever the engine plans against, the Metrics measure against.

That rule leaves the Metrics seeing Holidays from outside the Planning Window, and **the placed-day test is
what stops them being counted as the plan's own work**: a stretch scores only when it contains a day the plan
actually placed, not merely any free weekday. Holidays still extend a stretch (that is what a Bridge is for),
but a run that next year's public Holidays form on their own no longer counts. This is the standard
[`CONTEXT.md`](../../../../../CONTEXT.md) sets for Longest Vacation, *the longest stretch the plan produces*, and
it is why the fix belongs in the streak test rather than in the Holiday list the engine is handed.

**The streak metrics walk the free-day runs, and they walk them once: in the source and now in the run.**
`generateMetrics` calls `freeStreaks` once and hands the `FreeStreak[]` to all of them; the helpers take the
array, not the inputs to rebuild it from. They each called it themselves until a spy over one
`runPlanningPipeline` counted far more scans than the one per plan that was needed. A further streak-derived metric is
a predicate over an array the caller already holds, and costs no scan at all.

`freeStreaks` builds the placed-day set, unions it with the Holidays, expands seven days either side of the data and yields each unbroken run of Free
Days with these facts attached: whether it contains a day the plan placed, and whether it contains a weekend.
Longest Vacation, Long Weekends and Long Blocks are then predicates over that sequence: `hasPlacedDay`,
`length >= 3 && hasWeekend && hasPlacedDay`, and `length >= 3 && hasPlacedDay` anchored on the first day
inside the window.

Each used to own its copy: near-identical loops and separate constructions of the same
"placed days ∪ Holidays" set. That is how the placed-day rule below came to be applied by one and not the
other. A new metric about stretches of time off belongs here as a predicate, not as another loop.

**That set has one owner now: `dayOffKeys` in [`metrics/utils/dayOff.ts`](./metrics/utils/dayOff.ts).** It was still being built by hand
in `freeStreaks`, `getTotalEffectiveDays`, `calculateMaxWorkStreak` and
`getWorkedDaysPerMonth`, the last with an extra "in this year and not a weekend" filter. That last one
*was* the bug: it subtracted Holidays and PTO Days as two independent counts and understated Worked Days per
month by one day per Manual Day, because the lists overlap by construction. It filters its inputs and
then unions them through the same helper.

`dayKey` is exported beside it and is the only spelling of `toDateString()` left under `metrics/`; there
are none loose in either file. It is deliberately **not** `getKey` from `utils/cache.ts`: that one is keyed
on `Date.getTime()` and distinguishes noon from midnight, which is right for the memoisation it serves and
wrong here, where a Holiday carrying a time component still has to line up with a placed day at local
midnight. Both conventions are correct, and conflating them is the failure mode to watch for.

**Every streak metric applies it, and for a while only `calculateLongWeekends` did.**
Longest Vacation folded every free run into its maximum as the streak grew, so it reported whatever the
longest holiday-and-weekend run in the two-year set happened to be, including one lying entirely in
`year + 1`, on which the plan spends nothing. A Catalan 2026 plan placing a single July day reported a
Longest Vacation of 4, from Good Friday to Easter Monday 2027. It now tracks whether the current streak has
touched a placed day and folds the streak in only on close, which is also why the final streak has to be
closed after the loop rather than inside it.

`getLongBlocksPerQuarter` was the last to get it, and the test that was supposed to pin the rule could not
fail: it passed `placedDays: []`, which `freeStreaks` short-circuits to `[]` before any predicate runs, so
it exercised the empty-plan guard instead. A Holiday falling on a Friday counted as a Long Block the plan
never paid for, while `calculateLongWeekends` (same streak, same window) answered zero. The replacement
case places a PTO Day far away from the Holiday, so the unpaid run genuinely reaches the predicate.

**The distributions are bucketed by the Planning Window, not the calendar year.** `getMonthlyDist`,
`calculateQuarterDistribution` and `getLongBlocksPerQuarter` all take the window and size themselves from
it: `MONTHS_IN_YEAR + carryOverMonths` buckets for the months, and that count divided into
`MONTHS_IN_QUARTER` for the quarters. `windowMonthIndex` places a date at `(year(date) - year) * 12 +
month(date)`, so 5 January 2027 inside a 2026 window lands in bucket 12 rather than folding into January
2026; two months twelve months apart used to be added together. A date outside the window is dropped, not
clamped.

Both planning entry points pass `carryOverMonths` on the wire as itself now, rather than deriving it back
out of a month array; see the Planning Window section above. Charts must treat these arrays as
variable-length: `MonthlyDistributionChart` already did, and the quarter charts index
`COLOR_SCHEMES` modulo its length, since the brand colours no longer cover every bucket.

**A multi-day Bridge is consecutive *calendar* days that are all Workdays.** `findBridges` builds a
candidate with `addDays(workday, i)` and requires every step to be in the Workday set, so a Friday and the
following Monday are never one two-day candidate; they surface as two separate one-day Bridges. `MAX_MULTI_DAY_SIZE` is a working week, so any Workday run between two weekends is one candidate;
anything longer is two Bridges, and the marginal gain decides whether joining them is worth it.

**Efficiency is computed after expansion, not before.** A candidate's `startDate`/`endDate` are pushed
outwards through adjacent Free Days first, capped at `SAFETY_LIMIT` steps each way; only then is
`effectiveDays / ptoDaysNeeded` taken. This is why one PTO Day can score 4.0. A candidate with no adjacent
Free Day at all is rejected outright before any of that.

**`SAFETY_LIMIT` must stay far above any real free run, because a cap that can be reached is a plan
constraint wearing a guard's clothes.** It was 30, and this guide called it "a loop guard, not a plan
constraint", but the expansion loops already terminate on the first day that is neither a weekend nor a
Holiday, so the only genuine runaway is a calendar containing no working day at all. What 30 actually did
was truncate real spans: a company shutdown entered as Custom Holidays over five weeks left the Bridge
beside it reporting a 31-day span where the free run was 38. The selector counts exactly those
two dates as the Bridge's gain, so the Summary showed Effective Days 31 next to Longest Vacation 38: figures in one
`Metrics` object contradicting each other, the invariant stated above. Bounding by the Planning Window
instead was the other candidate and is wrong: a span is *meant* to expand into next year's Holidays, which
is why the Metrics see the unfiltered two-year set. 366 is chosen so no free run inside the fetched data can
reach it.

**The generators are ranking policies over one candidate set, and the set is found once.**
`findPlanningCandidates` enumerates the Workdays and finds the Bridges; `runPlanningPipeline` calls it once
and hands the result to both. They each carried the same prologue until then (the weekend filter,
`getAvailableWorkdays`, `findBridges`, then a selector) on identical arguments, so the whole candidate half
of the engine ran twice per plan. [`pipeline.test.ts`](./pipeline.test.ts) pins it: one `findBridges` call per run.

The weekend filter is gone from both, not moved: `createHolidaySet` drops weekend Holidays itself, and it is
the only consumer of the `holidays` argument in either `getAvailableWorkdays` or `findBridges`, so the
generators' copies were inert. The rule the filter enforced (a Bridge must not claim credit for absorbing a
Saturday) is enforced there and stated in the cache row above.

`effectivePtoDays = Math.min(availableWorkdays.length, ptoDays)` stays in `generateSuggestions` alone. It is
inert (both selectors add a Bridge only when its PTO Days are unused, so a selection can never exceed the
distinct available Workdays) and giving it to `generateAlternatives` for symmetry would be a behaviour change
wearing a tidy-up's clothes.

**`generateAlternatives` calls `selectBridges`, not `selectBridgesForStrategy`.** It needs the two parameters the
Strategy entry point does not take: another Strategy's objective, and the days a run must leave out.

**The Alternatives run the other Strategies first, then take the Suggestion apart one Rest Block at a time.** The
other two objectives over the same candidates are the most different plans the engine can make. After them,
each Rest Block of the Suggestion (`restBlocksOf`, largest first, the same seven-day separation the Rest Block
metric uses) is excluded and the chosen objective re-run; every plan found that way is a seed whose own blocks are
then excluded in turn, breadth first, with the exclusions accumulating. The number of selection runs is bounded
by `ALTERNATIVES.RUNS_PER_ALTERNATIVE` per Alternative asked for, which is what bounds the cost.

**Distinct is a distance, not disjointness.** `planDistance` is one minus the Jaccard index of two day sets, and a
plan is offered only when it is at least `ALTERNATIVES.MIN_DIFFERENCE` from the Suggestion and every Alternative
kept. The old rule removed every Bridge touching the Suggestion before searching, which took the best Bridges out
of every Alternative, and two of its seven orderings started from the worst Bridges on purpose; together they
guaranteed Alternatives worse than the Suggestion. `generateAlternatives.test.ts` pins that an Alternative may
now keep the Suggestion's strongest Bridge.

**No Alternative beats the Suggestion, and that is what makes it an alternative.** The Suggestion is the
recommendation; an Alternative trades some of its Effective Days or its Efficiency for a different shape of year,
never the other way round. It has to be enforced, because the other Strategies' plans are among the seeds: for a
`GROUPED` Suggestion the `OPTIMIZED` plan covers far more days, and offering it would tell every Grouped user
their plan was the worse one. Two layers hold it:

- `generateAlternatives` refuses a plan whose `coveredDays` (the union of its Bridges' spans and its placed days)
  exceeds the Suggestion's, or whose `coveredDays` per placed day does, so the search keeps looking instead of
  returning a short list. Without Manual Days `coveredDays` is exactly the measured Effective Days, which is the
  property `strategies.test.ts` already pins for the Suggestion.
- `runPlanningPipeline` re-checks the **measured** Effective Days and Efficiency of each Alternative against the
  Suggestion's and drops any that exceeds them. A Manual Day can make the two measures part company (it is a
  stretch in the Metrics whether or not a span reaches it), and the rule is about what the user sees.

So for `OPTIMIZED` the other Strategies' plans are usually offered, since they cover fewer days, and for
`GROUPED` and `BALANCED` the `OPTIMIZED` plan is refused whenever it covers more, which over a real calendar
is every time.

**Every Alternative is stamped with the Strategy that found it, not the one the user chose.** The other
Strategies' plans carry their own value in `strategy`, the Rest Block re-runs carry the chosen one. Nothing in
the planner renders a Suggestion's `strategy` (the sidebar and the Summary read the filters store), so the field
is free to say where a plan came from, and the Summary needs exactly that: its "alternatives that add more days"
notice compares the plan on screen only with the Alternatives whose `strategy` is the chosen one. With the ceiling
above, that notice can only fire on a hand-edited plan that fell below one of them, which is what it is for; a
Grouped user is never told the Optimized plan has more days, because that is what choosing Grouped means.

**Bonus Days are measured against days placed, not the budget, and `generateMetrics` no longer takes the
budget at all.** It computes `bonusDays = totalEffectiveDays − days.length`; the baseline is what the plan
actually spent. It used to accept `totalPtoBudget` "so callers that already have it can pass it" and then
never destructure it, an interface with a parameter and no behaviour behind it, which one caller dutifully
supplied and a test existed only to confirm was discarded. Both are gone.

**Gain is the budget-based twin, and it lives in `utils/budget.ts` beside `measureBudget`.** `measureGain`
answers `{ overBudget, gain }` from `totalEffectiveDays` and the whole budget. It was a line of
arithmetic inside a `useMemo` in [`Summary.tsx`](../../ui/modules/pages/planner/Summary.tsx) (a [`CONTEXT.md`](../../../../../CONTEXT.md) term with no
owner and no test), and the thing that makes it worth naming is the denominator: Gain divides by the
**budget**, Efficiency by the **days placed**, so they coincide only when the plan spends the budget in
full. [`budget.test.ts`](./utils/budget.test.ts) pins that they part company, verified by swapping the denominator.

`overBudget` is deliberately not called a Bonus Day. It is Gain's numerator measured against the budget,
which is a different quantity from the glossary's Bonus Day, and the planner guide explains why the badge
reading it says "over budget" and never the word bonus.

**Effective Days are the free streaks that contain a placed day, and the Bridges no longer enter them.**
`getTotalEffectiveDays` sums the length of every `FreeStreak` with `hasPlacedDay`, the same predicate Longest
Vacation takes the maximum of, so the two cannot contradict each other. It used to union the spans of the Bridges
whose every PTO Day was still placed, plus the placed days themselves, and that had two faults: a lone Manual Day
on a Friday counted one where Longest Vacation counted three, and removing one day of a two-day Bridge discarded
its whole span, so the Friday left behind counted one beside the weekend it still led into. Both read the same
from the streaks now, and the re-check that stopped a span outliving a Manual Day handed back is gone with the
spans: a day that is a workday again ends the streak by construction.

**It equals the selector's own belief, and that is the property to keep.** The union of the chosen Bridges' spans
is exactly the free streaks containing their PTO Days, because each span already expanded through every adjacent
Free Day. [`strategies.test.ts`](./strategies.test.ts) asserts the two are equal for every Strategy over a real
calendar; the walk this replaced was 25 days apart on the same assertion.

**`bridgesUsed` counts the Bridges that survived, not the ones the plan was born with.** It was
`bridges?.length`, taken straight from the array the caller passed, while Effective Days had already
discarded some, so a two-day Bridge with one day removed left the card reading
"Bridges used: 1" beside an Efficiency of exactly 1.0 and no Bonus Days, describing bridging that was no
longer happening. It comes from `getValidBridges` now, which keeps a Bridge only while every one of its PTO Days is placed. `toggleDaySelection` never re-derives
`currentSelection.bridges` and starts no worker run, so they would otherwise stay out of step until an
unrelated change forced a re-plan.

**`removedDays` reaches `getAvailableWorkdays` and nothing else, on purpose.** A Removed Day is a date the
user has told us they *will work*: the planner must not place it, but it is not a Free Day. Passing it into
`createHolidaySet` (or into `findBridges`) would let `analyzePotentialBridge` count it as adjacent free
time and expand a Bridge through it, inflating `effectiveDays` and therefore Efficiency for every Bridge
that touches it. Dropping the date from the Workday list is the whole mechanism; there is deliberately no
second consumer.

**The metrics year is passed in, not inferred.** `generateMetrics` takes a required `year` and hands it to
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
scan starts seven days before the earliest date, so a block can open in December of `year - 1`; every
planning year whose 1 January is a Monday or a Sunday does it, with a PTO Day on the adjacent January
workday. Anchoring on the run's first day then gave `windowMonthIndex` a negative index, `Math.floor(-1 / 3)`
is `-1`, and the `quarter >= 0` guard threw away a Long Block the plan had paid for, while
`calculateLongWeekends` counted the same stretch and `calculateQuarterDistribution` put the placed day in Q1,
so the Summary's quarter charts disagreed about the same quarter. `getLongBlocksPerQuarter` anchors on
`streak.days.find((day) => windowMonthIndex(day, window) >= 0)` instead, and skips the run when that finds
nothing, so a block lying wholly outside the window is still dropped.

**The `quarter >= 0` half of that guard is gone, and the `find` is why.** Once the anchor is a day whose
`windowMonthIndex` is already `>= 0`, the floor of a non-negative over three cannot be negative; the
comparison could not fail. Only the upper bound does real work now. The other `>= 0` checks in this file,
at the top of `getMonthlyDist` and in `calculateQuarterDistribution`, are **live**: those read a raw day, not
one the `find` has already vetted.

**Rest Blocks are separated by more than seven days.** Two PTO Days five days apart are one Rest Block even
with Workdays between them. Long Weekends, Longest Vacation and Long Blocks use a different rule entirely:
they scan the real calendar from seven days before the first date to seven days after the last, so a
stretch straddling the edge of the data is still counted whole.

**`generateMetrics` has one construction of `Metrics`, and used to have more.** A zero-day guard hand-built
every field, nearly all of them byte-for-byte what the helpers already answer for an empty day
list: `getMonthlyDist`, `calculateQuarterDistribution` and `getLongBlocksPerQuarter` size themselves from
the Planning Window and fill zeros, `freeStreaks` short-circuits to `[]`, `getValidBridges` filters
everything out, `calculateRestBlocks` and `getFirstLastBreak` have their own empty answers. Only the
Efficiency division needs a guard, because `0 / 0` is `NaN`.

The rest were **wrong**. Max Work Streak and Worked Days per month are scoped to the calendar
year, not to the plan, so with nothing placed they are the whole year still standing, around 261 and 21.8,
not 0. `CONTEXT.md` defines Max Work Streak as the longest run of Workdays *left standing after the plan is
applied*, and a plan that placed nothing leaves all of them standing. The guard reported 0 for both and the
test pinned the zeros. A second construction of a shape is a place for it to disagree with the first, and
this one did.

## The cache protocol

`utils/cache.ts` memoises date keys in a module-level map that is never evicted, and the Holiday set in a
single module-level slot. A second run therefore reuses the first run's Holidays unless someone clears it,
silently, because a stale Holiday set is structurally valid.

**The Holiday set used to be a keyed `Map` with one key.** `createHolidaySet(holidays, cacheKey?)` fell back
to `'default'`, and that fallback was the only key any production call site ever wrote; the second argument
existed on the interface, in the type, and in the test cases that were its only callers. It is one slot and `clearHolidayCache()` is one assignment, which
reads as what it is: a memo the pipeline resets, not a cache anyone keys into. If a second Holiday list ever
needs to coexist, the key comes back **with** the caller that needs it.

**`runPlanningPipeline` owns the clear, and nothing else in production calls it.** `clearDateKeyCache()` and
`clearHolidayCache()` open the pipeline. The pipeline is the right owner because it is the only code that
knows where a run begins; a `clear` anywhere below it would evict a set the same run is still using.

**The Holiday memo earns its keep inside one `findPlanningCandidates` call, not across the generators.**
That is worth stating because the sharing it was written for has moved: the generators no longer touch it at
all: `createHolidaySet`'s production callers are `getAvailableWorkdays` and `findBridges` in
`utils/helpers.ts`, and `findPlanningCandidates` calls them one after the other on the same Holiday list.
The memoisation is what makes the second call free. Deleting the cache after the prologue hoist was
considered on the grounds that the hoist had left it with nothing to share; it would in fact rebuild the
Holiday set twice on every run. Keep it, and keep the clear where it is.

That is an amendment to [ADR 0006](../../../../../adr/0006-caller-owned-calculation-caches.md), and it is
written into that ADR's `## Status` block, dated 2026-08-24; the ADR originally put the clear at each caller
because the orchestration lived at each caller. It no longer does.
`worker.ts` and the holidays store's `generateSuggestions` action now pass inputs and read a result; neither
knows the caches exist, and a new entry point cannot forget a step it never had.

`fetchHolidays` replaces the Holiday set without planning, and `toggleDaySelection` recomputes Metrics, which
reach neither cache: a `clear` in either would evict a set the next run is about to rebuild anyway.

`getKey` is keyed on `Date.getTime()`, so two `Date` objects for the same day at different times of day
produce two cache entries with the same string value (harmless), but it is why every date the engine
constructs is at local midnight.

## Constants

Every tunable lives in `PTO_CONSTANTS` in `const.ts`. A magic number anywhere else in this folder is a
defect: add the field instead. That was a rule this guide stated and the folder broke: the metrics kept
`LONG_BLOCK_MINIMUM_DAYS` and `LONG_WEEKEND_MINIMUM_DAYS` as file-local consts, `SCAN_MARGIN_DAYS` in
`streaks.ts`, a bare `daysDiff > 7` for the Rest Block separation and a bare `/ 12` sitting below the file's
own month count. They are the `METRICS` block now, and `grep` for a loose numeric literal under this folder
comes back empty. Changing one changes the plans users see, so treat an edit here as a
behaviour change and expect the selector tests to move.

| Field | Value | Unit and meaning |
| --- | --- | --- |
| `SAFETY_LIMIT` | 366 | Days. The most a Bridge boundary may expand backwards or forwards through Free Days. A loop guard, and it has to be set high enough to stay one; see the trap below |
| `BRIDGE_GENERATION.EFFICIENCY_COMPARISON_THRESHOLD` | 0.1 | Efficiency ratio. Differences smaller than this count as a tie and are resolved by `effectiveDays` |
| `EFFICIENCY.MINIMUM` | 2 | Efficiency ratio. The marginal floor of `OPTIMIZED` and `BALANCED`: a Bridge is taken only while the days it adds, per PTO Day, reach this |
| `EFFICIENCY.BLOCK_MINIMUM` | 1.4 | Efficiency ratio. The marginal floor of `GROUPED`, seven days for five, and the admission floor of `findBridges`; it must stay the lowest floor any Strategy applies |
| `BRIDGE_SEARCH.MIN_MULTI_DAY_SIZE` | 2 | Consecutive Workdays. Smallest multi-day candidate tried, in addition to the single-day ones |
| `BRIDGE_SEARCH.MAX_MULTI_DAY_SIZE` | 5 | Consecutive Workdays. Largest multi-day candidate tried: a working week |
| `SELECTION.GROUPED_MAX_BLOCK_DAYS` | 16 | Days. The break length `GROUPED` grows a block up to, two weeks and both weekends; each day past it costs a point |
| `SELECTION.BALANCED_MAX_BLOCK_DAYS` | 9 | Days. The break length `BALANCED` prefers up to, a week and both weekends, penalised past it the same way |
| `SELECTION.MAIN_VACATION_BLOCK_DAYS` | 16 | Days. The longest block `MAIN_VACATION` builds in the Preferred Months; a hard admission limit, not a penalised cap |
| `SELECTION.RANK_TOLERANCE` | 1e-9 | Rank values closer than this are a tie and the next key decides; the gain is a float division |
| `ALTERNATIVES.MIN_DIFFERENCE` | 0.25 | Share of two plans' combined days they must not have in common for both to be offered |
| `ALTERNATIVES.RUNS_PER_ALTERNATIVE` | 6 | Selection runs the Alternatives may spend per Alternative asked for; bounds the cost, not the result |
| `METRICS.LONG_BLOCK_MINIMUM_DAYS` | 3 | Consecutive days. Below this a Rest Block is not a Long Block |
| `METRICS.LONG_WEEKEND_MINIMUM_DAYS` | 3 | Consecutive Free Days. The floor for a Long Weekend, which must also contain a weekend and a placed day |
| `METRICS.REST_BLOCK_SEPARATION_DAYS` | 7 | Days. Two placed days further apart than this are separate Rest Blocks. **Not the same value** as the scan margin below, and they are free to move independently |
| `METRICS.STREAK_SCAN_MARGIN_DAYS` | 7 | Days. How far either side of the data `freeStreaks` scans, so a stretch straddling the edge is still counted whole |

## Testing

Every module has a co-located `.test.ts`. Inputs are literal `Date` and `HolidayDTO` values and assertions
are on returned values; there is nothing to mock, with one exception below.

[`strategies.test.ts`](./strategies.test.ts) is the benchmark: the Spanish national calendar for 2026 and a
22-day budget through `runPlanningPipeline`, asserting what each Strategy is *for* rather than the dates it
picks. Every Strategy spends the budget and never lands under its own floor; what the selector believed it gained
equals the measured Effective Days; Optimized produces the most Effective Days and Grouped the longest break, with
Balanced between them on both; and every plan offered is at least `MIN_DIFFERENCE` from every other. A change to
an objective that keeps those holding is a tuning; one that breaks them changes what a Strategy means, and wants
the ADR amended.

Fixtures share January 2025 as their reference month, because its shape exercises every case by hand: Jan 3
is a Friday, Jan 4 and Jan 5 the weekend, Jan 6 to Jan 10 Monday through Friday, and the month holds 23
Workdays. A new case belongs in that month unless it is specifically about year boundaries or quarters.

`generateSuggestions.test.ts` is the exception: it wraps `selectBridgesForStrategy` in a `vi.fn(actual.…)`
spy rather than replacing it, so every other case still runs the real selection while the Strategy reaching
the selector stays assertable.

Any test whose subject reaches `getKey` or `createHolidaySet` **must** call `clearDateKeyCache()` and
`clearHolidayCache()` in `beforeEach`. Without it a case inherits the previous case's Holiday set and
passes or fails for reasons that have nothing to do with what it asserts. [`cache.test.ts`](./utils/cache.test.ts) pins that
behaviour deliberately, including the case proving a second `createHolidaySet` call ignores its new
argument.

**The rule is per `describe`, not per file, and one block was missing it.**
`describe('findBridges efficiency floor')` in [`utils/helpers.test.ts`](./utils/helpers.test.ts) had no `beforeEach`, so every case in
it ran against whatever Holiday set the block above had left behind, invisibly, because its cases pass
`holidays: []` and happened to assert things the stale set did not disturb. The first case added there that
actually depended on its own Holidays failed with a span truncated by a set it never passed. A new
`describe` in these files starts with the clears, even when its cases look like they have no Holidays
in them.

That covers `generateSuggestions.test.ts`, `generateAlternatives.test.ts`, `utils/helpers.test.ts`,
`utils/cache.test.ts` and `suggestions/utils/selectors.test.ts`. The selector itself counts in `dayIndex` and
no longer reaches `getKey`, so the clears there are for the candidates its fixtures build, and they stay.
[`alternatives/utils/helpers.test.ts`](./alternatives/utils/helpers.test.ts) reaches neither cache and has none. It does **not** cover the metrics entry point: nothing under `metrics/` imports
the cache module, because `generateMetrics` reaches only `utils/selection.ts` and `metrics/utils/helpers.ts`
and both match dates with `toDateString()`. Adding a clear there would be dead code, so [`generateMetrics.test.ts`](./metrics/generateMetrics.test.ts)
and [`metrics/utils/helpers.test.ts`](./metrics/utils/helpers.test.ts) have none; do not "restore" it.

# apps/web/src/domain/calendar

## Purpose

The planning engine. Given a Planning Window, a set of Holidays and a PTO budget, it finds the Bridges that
turn that budget into the longest stretches away from work, picks a set of them under the chosen Strategy,
offers Alternatives, and measures the result. Pure functions throughout: same inputs, same output, no
clock beyond `startOfToday()`, no I/O. The layer contract it sits under is in [`../CLAUDE.md`](../CLAUDE.md)
([ADR 0003](../../../../../adr/0003-pure-calendar-domain-effectful-payment-domain.md)); the words it uses are
in [`CONTEXT.md`](../../../../../CONTEXT.md).

## Files

| File | Contents |
| --- | --- |
| [`types.ts`](./types.ts) | `Bridge`, `Suggestion`, `Metrics`, `FirstLastBreak`, the `FilterStrategy` const object plus its type, and the pair that guards the wire: `isFilterStrategy` and `DEFAULT_FILTER_STRATEGY` |
| [`const.ts`](./const.ts) | `PTO_CONSTANTS`, every tunable in the engine; the unit and meaning of each are in [Constants](#constants) below |
| [`utils/cache.ts`](./utils/cache.ts) | `getKey`, `getCombinationKey`, `createHolidaySet`, and the two `clear*` functions the caller must use |
| [`utils/helpers.ts`](./utils/helpers.ts) | `getAvailableWorkdays` (Workday enumeration) and `findBridges` (candidate generation and ranking) |
| [`utils/candidates.ts`](./utils/candidates.ts) | `findPlanningCandidates`: the Workdays and the Bridges, found once per run and handed to both generators |
| [`utils/selection.ts`](./utils/selection.ts) | `resolveSelectedDays` folds Manual Days in and Removed Days out of a Suggestion's day list |
| [`utils/budget.ts`](./utils/budget.ts) | `measureBudget`: how much of the PTO budget a plan has spent, and the Remaining Budget |
| [`suggestions/generateSuggestions.ts`](./suggestions/generateSuggestions.ts) | The entry point: Workdays → Bridges → Strategy selector → Suggestion |
| [`suggestions/utils/selectors.ts`](./suggestions/utils/selectors.ts) | `STRATEGY_ORDERING`, one `Ordering` per Strategy, plus `selectGreedily`, the single walk they all feed, and `selectBridgesForStrategy` which composes the two |
| [`window.ts`](./window.ts) | `PlanningWindow`, `planningWindowMonths`, `MONTHS_IN_YEAR`, `MONTHS_IN_QUARTER` and `windowMonthCount`/`windowQuarterCount` |
| [`pipeline.ts`](./pipeline.ts) | `runPlanningPipeline`: the whole run: caches, pseudo-Holidays, budget, the two planning calls and the Metrics |
| [`alternatives/generateAlternatives.ts`](./alternatives/generateAlternatives.ts) | Re-runs selection under seven different Bridge orderings to produce distinct Alternatives |
| [`metrics/generateMetrics.ts`](./metrics/generateMetrics.ts) | Assembles the `Metrics` object for a Suggestion or an Alternative |
| [`metrics/utils/streaks.ts`](./metrics/utils/streaks.ts) | `freeStreaks`: the one scan of the free-day runs the plan produces |
| [`metrics/utils/helpers.ts`](./metrics/utils/helpers.ts) | One function per metric (Long Weekends, Rest Blocks, Max Work Streak, Longest Vacation, Worked Days per month, quarterly and monthly distribution), plus `windowMonthIndex`, which places a date in one of the buckets `window.ts` sizes |

## Public API

**`runPlanningPipeline` is the entry point the outside world calls.** One function, one input object, one
result:

```
runPlanningPipeline({ window, ptoDays, autoSuggestCount?, holidays, manuallySelectedDays?,
                      removedSuggestedDays?, allowPastDays, strategy, locale, maxAlternatives })
  → { planned, suggestion, alternatives }
```

It owns everything a run needs and a caller used to have to remember: clearing both caches, turning Manual
Days into `manual-N` pseudo-Holidays, expanding the Planning Window into months, computing
`effectivePtoDays`, short-circuiting when there is nothing to plan, and measuring the Suggestion and every
Alternative with the same arguments. `planned: false` is the short circuit: the suggestion it carries is
empty but its Metrics are real, measured by the engine, so no caller has to invent a zeroed object.

**`PlanningResult` is a discriminated union, and everything in it is a `MeasuredSuggestion`.** `Suggestion`
declares `metrics?` because the two generators produce one without Metrics; this pipeline never does, on
either branch. Saying so in the type is what lets the stores and the whole planner screen read
`suggestion.metrics.totalEffectiveDays` rather than `metrics?.x ?? 0`. Six files used to guard against a
state this producer cannot be in, which turns a genuine regression into a silent zero instead of a type
error. `MeasuredSuggestion` is `Suggestion & { metrics: Metrics }` and it travels: the worker's wire type
requires `metrics`, `deserializeSuggestion` returns one, and `HolidaysState` holds them. The one place that
has to earn it is rehydration: `onRehydrateStorage` drops a persisted Suggestion with no Metrics rather
than pretending, because a stored blob is the only input the type cannot vouch for.

The three generators below are still exported and still tested on their own, but nothing outside the domain
calls them directly:

- `generateSuggestions({ ptoDays, candidates, strategy })` → `{ days, bridges?, strategy }`
- `generateAlternatives({ ptoDays, candidates, maxAlternatives, existingSuggestion, strategy })` → `Suggestion[]`
- `generateMetrics({ suggestion, locale, year, bridges, holidays, allowPastDays, manuallySelectedDays, removedSuggestedDays, carryOverMonths? })` → `Metrics`

**`measureBudget` is the one place the budget arithmetic lives, and it is built on `resolveSelectedDays` so it
cannot disagree with the Metrics.** It answers `{ suggested, manual, spent, remaining }` for a budget and a
plan; `spent` is exactly `resolveSelectedDays(...).length`, which is the same denominator Efficiency uses, and
`remaining` is the Remaining Budget as [`CONTEXT.md`](../../../../../CONTEXT.md) defines it, clamped at zero. That
arithmetic used to be written out at four call sites plus a fifth copy behind a store action nothing called;
the store action was the only one with tests. `toggleDaySelection`, `PlannerPanel`'s status readout and the
sidebar's budget control all route through this now. A new caller asking "how many days are left" imports
this rather than subtracting two lengths.

`resolveSelectedDays` is the fourth export the outside world uses: `generateMetrics` applies it to its own
input, and [`CalendarExport.tsx`](../../ui/modules/sidebar/components/CalendarExport.tsx) applies it again so the exported calendar contains exactly the days the
Metrics were computed from. It matches on `toDateString()`, so a `Date` carrying a time component still
lines up, and it returns the original array unchanged when there are no Manual or Removed Days. Everything
else under `utils/` and `suggestions/utils/` is internal.

**Both `manuallySelectedDays` and `removedSuggestedDays` are required, and neither defaults.** They used to
default to `[]`, and a caller that omitted them got Metrics measured against the days
the engine placed *by itself*, while `getTotalEffectiveDays` still counts Bridge spans that ran straight
through the Manual Days, because the pseudo-Holidays make them Free Days for the expansion. Efficiency
(`totalEffectiveDays / days.length`) and Bonus Days (`totalEffectiveDays - days.length`) were then inflated by
every Manual Day a span covered, and so were the monthly and quarterly distributions. Both planning pipelines
omitted them once, while `toggleDaySelection` passed them, so the same unchanged plan reported two different
Efficiency figures depending on which path had last written the Metrics, and toggling a day on and off again was
enough to make the number jump. The mirrored blocks in [`worker.test.ts`](../../infrastructure/workers/worker.test.ts) and [`holidays.test.ts`](../../application/stores/holidays.test.ts) pin it on both
sides.

**The Planning Window is two numbers, and `window.ts` is where they become months.** `PlanningWindow` is
`{ year, carryOverMonths }`, the glossary term with the shape it has always had, and
`planningWindowMonths` expands it. `runPlanningPipeline` takes the window and expands it itself.

It used to take `year` *and* `months: Date[]`, and the round trip that produced was the finding: the UI
expanded `{ year, carryOverMonths }` with its own copy of `MONTHS_IN_YEAR`, serialised 12–24 `Date`s to ISO
strings, the worker parsed them back, and the pipeline reversed the expansion with
`Math.max(0, months.length - MONTHS_IN_YEAR)` using the *domain's* copy of the same constant. Both halves
travelled, and **nothing checked they agreed**: a `year` of 2026 beside months built for 2025 would place
the plan in one year and scope Max Work Streak, Worked Days per month and every `windowMonthIndex` bucket to
the other, with no error and no way to see it. That is now unrepresentable. `serializeMonths`,
`deserializeMonths`, the UI's duplicate constant and the UI's `getTotalMonths` are all gone with it.

[`window.test.ts`](./window.test.ts) pins that the expansion and `windowMonthCount` agree, which is the property the two
constants made possible to break; verified by desyncing them.

`generateMetrics` still takes `year` and `carryOverMonths` separately, because Max Work Streak and Worked
Days per month are scoped to a single calendar year; see the trap below.

## The pipeline, in order

1. `generateSuggestions` drops Holidays that fall on a weekend. They are already Free Days, and keeping
   them would let a Bridge claim credit for absorbing a Saturday.
2. `getAvailableWorkdays` walks each month of the expanded window day by day and keeps the Workdays: not
   a weekend, not a Holiday, not one of `removedDays`, and (unless `allowPastDays`) not before today. It has
   no other notion of range, and a duplicated month would yield duplicated Workdays, which is why the
   expansion has one owner and callers no longer hand one in.
3. `findBridges` generates candidates of 1, 2 and 3 consecutive Workdays, expands each candidate outwards
   through the Free Days on either side, computes `effectiveDays / ptoDaysNeeded`, and keeps the candidate
   only if that ratio reaches `EFFICIENCY.MINIMUM`. Duplicates are collapsed by their PTO-day set, keeping
   the most efficient. The result is sorted by Efficiency, with differences under
   `EFFICIENCY_COMPARISON_THRESHOLD` treated as a tie and broken by `effectiveDays`, because the ratio is a float
   division, so an exact comparison would order equivalent Bridges on rounding noise.
4. The Strategy selector walks that order greedily, taking any Bridge that fits the remaining budget and
   does not reuse a date already taken.
5. `generateMetrics` measures the outcome separately, from the day list, not from the selector.

## Strategies

`FilterStrategy` has three values, and all three admit the same population of Bridges: the `MINIMUM`
efficiency floor is applied in `findBridges`, before any Strategy sees the candidates. What differs is
only the order the greedy pass walks them in.

| Strategy | Order |
| --- | --- |
| `GROUPED` | Most PTO Days first, Efficiency as the tie-break, so longest blocks win |
| `OPTIMIZED` | Efficiency first, but differences within `EFFICIENCY_COMPARISON_THRESHOLD` count as a tie and the longer stretch wins |
| `BALANCED` | Scored, then stably partitioned so high-value Bridges come first |

`BALANCED` scores each Bridge as `(efficiency × 0.6 + effectiveDays / VALUE_DIVISOR × 0.4) × bonus`, where
`bonus` is `MULTI_DAY_BONUS` for Bridges meeting both `HIGH_VALUE_THRESHOLD_*` and `BASE_SCORE` otherwise.
The divisor brings an absolute span onto the same scale as a ratio, so the two weights mean what they say.
It then partitions that order so high-value Bridges come first, which is what stops a crowd of one-day
Bridges squeezing out a long block; [`selectors.test.ts`](./suggestions/utils/selectors.test.ts) pins that with three 6-effective single-day Bridges
that outscore a 3-day/9-effective block and lose to it anyway.

**A Strategy is an `Ordering`, and the greedy walk is written once.** `STRATEGY_ORDERING` maps each
`FilterStrategy` to a `(bridges: Bridge[]) => Bridge[]`; `selectGreedily` walks whatever it is given, taking
any Bridge that fits the remaining budget and reuses no date. That is the whole of selection.

It was three dispatch sites over two functions: a lookup table in `generateSuggestions`, a `switch` in
`selectors.ts` whose `default` *was* the BALANCED branch, and a ternary in `generateAlternatives`. A fourth
Strategy meant editing all three and knowing that default was load-bearing rather than defensive. The greedy
walk itself was written twice in one file, and BALANCED's "two passes" were not two: the second call shared
the first's accumulator and its `total < target` guard was already enforced by the loop's own `break`, so it
was a stable partition followed by one walk. It is now written as one.

An `Ordering` is an array transform rather than a comparator, which is why it survives the rotation case
below that a comparator cannot express.

**`byScore` no longer attaches the score to the Bridge.** It used to `map` each Bridge into
`{ ...bridge, score }` and sort those, so a BALANCED Suggestion carried an undeclared `score` field on every
Bridge it returned, across the wire and into the store. It scores into a side `Map` now and sorts the
originals, which also keeps object identity, the thing that made the high-value test assert on identity and
then fail once the ordering always ran.

**The two generators used to disagree about an unknown Strategy value, and now cannot.**
`generateSuggestions` looked the value up with `Object.hasOwn` and fell back to `GROUPED`, while
`generateAlternatives` routed anything not `BALANCED` into a `switch` whose default *was* `BALANCED`, so one
bad string produced a Grouped Suggestion beside Balanced Alternatives. There is one fallback now,
`STRATEGY_ORDERING[strategy] ?? STRATEGY_ORDERING[GROUPED]`, reached by both, and
[`generateSuggestions.test.ts`](./suggestions/generateSuggestions.test.ts) pins that an unknown Strategy *plans* identically to `GROUPED` rather than
merely that it routes somewhere. [`worker.ts`](../../infrastructure/workers/worker.ts) narrows with `isFilterStrategy` before any of this and was the
way in; the fallback is depth against a caller that has not been type-checked, not an error path.

Leaving budget unspent is a correct outcome, not a gap to fill: the walk stops short only when every
remaining Bridge conflicts with one already taken, and `selectors.test.ts` pins that state deliberately. A
third pass used to run after the other two and could select nothing at all.

## Invariants and traps

**`generateMetrics` must see exactly the Holiday list the engine planned against: the whole two-year set,
unfiltered.** It is tempting to narrow it to `isInSelectedRange`, and that was tried and reverted. The
planning calls receive the unfiltered list, `createHolidaySet` applies no window filter, and
`analyzePotentialBridge` expands a Bridge's span straight through a next-year Holiday; `getTotalEffectiveDays`
then reports that expanded span. Filtering only the *Metrics* input leaves Longest Vacation, Long Weekends
and Long Blocks scanning a calendar missing the very day the span was built on, so they contradict Effective
Days inside the same Metrics object. Whatever the engine plans against, the Metrics measure against.

That rule leaves the Metrics seeing Holidays from outside the Planning Window, and **the placed-day test is
what stops them being counted as the plan's own work**: a stretch scores only when it contains a day the plan
actually placed, not merely any free weekday. Holidays still extend a stretch, which is what a Bridge is for,
but a run that next year's public Holidays form on their own no longer counts. This is the standard
[`CONTEXT.md`](../../../../../CONTEXT.md) sets for Longest Vacation, *the longest stretch the plan produces*, and
it is why the fix belongs in the streak test rather than in the Holiday list the engine is handed.

**Three metrics walk the free-day runs, and they walk them once, in the source and now in the run.**
`generateMetrics` calls `freeStreaks` once and hands the `FreeStreak[]` to all three; the helpers take the
array, not the inputs to rebuild it from. They each called it themselves until a spy over one
`runPlanningPipeline` counted 33 scans where 11 were needed, one per plan. A fourth streak-derived metric is
a predicate over an array the caller already holds, and costs no scan at all.

`freeStreaks` builds the placed-day set, unions it with the Holidays, expands seven days either side of the data and yields each unbroken run of Free
Days with two facts attached: whether it contains a day the plan placed, and whether it contains a weekend.
Longest Vacation, Long Weekends and Long Blocks are then predicates over that sequence: `hasPlacedDay`,
`length >= 3 && hasWeekend && hasPlacedDay`, and `length >= 3` anchored on the first day inside the window.

Each used to own its copy: three near-identical loops and five separate constructions of the same
"placed days ∪ Holidays" set. That is how the placed-day rule below came to be applied by one and not the
other. A new metric about stretches of time off belongs here as a predicate, not as a fourth loop.

**That set has one owner now: `dayOffKeys` in [`metrics/utils/dayOff.ts`](./metrics/utils/dayOff.ts).** It was still being built by hand
four times: in `freeStreaks`, `getTotalEffectiveDays`, `calculateMaxWorkStreak` and
`getWorkedDaysPerMonth`, the fourth with an extra "in this year and not a weekend" filter. That fourth one
*was* the bug: it subtracted Holidays and PTO Days as two independent counts and understated Worked Days per
month by one day per Manual Day, because the two lists overlap by construction. It filters its inputs and
then unions them through the same helper.

`dayKey` is exported beside it and is the only spelling of `toDateString()` left under `metrics/`, and there
are none loose in either file. It is deliberately **not** `getKey` from `utils/cache.ts`: that one is keyed
on `Date.getTime()` and distinguishes noon from midnight, which is right for the memoisation it serves and
wrong here, where a Holiday carrying a time component still has to line up with a placed day at local
midnight. Two conventions, both correct, and conflating them is the failure mode to watch for.

**`calculateLongWeekends` and `calculateLongestVacation` both apply it, and for a while only the first did.**
Longest Vacation folded every free run into its maximum as the streak grew, so it reported whatever the
longest holiday-and-weekend run in the two-year set happened to be, including one lying entirely in
`year + 1`, on which the plan spends nothing. A Catalan 2026 plan placing a single July day reported a
Longest Vacation of 4, from Good Friday to Easter Monday 2027. It now tracks whether the current streak has
touched a placed day and folds the streak in only on close, which is also why the final streak has to be
closed after the loop rather than inside it.

**The distributions are bucketed by the Planning Window, not the calendar year.** `getMonthlyDist`,
`calculateQuarterDistribution` and `getLongBlocksPerQuarter` all take the window and size themselves from
it: `MONTHS_IN_YEAR + carryOverMonths` buckets for the months, and that count divided into
`MONTHS_IN_QUARTER` for the quarters. `windowMonthIndex` places a date at `(year(date) - year) * 12 +
month(date)`, so 5 January 2027 inside a 2026 window lands in bucket 12 rather than folding into January
2026; two months twelve months apart used to be added together. A date outside the window is dropped, not
clamped.

Both planning entry points pass `carryOverMonths` on the wire as itself now, rather than deriving it back
out of a month array; see the Planning Window section above. Charts must treat these arrays as
variable-length. `MonthlyDistributionChart` already did, and the two quarter charts index
`COLOR_SCHEMES` modulo its length, since four brand colours no longer cover every bucket.

**A multi-day Bridge is consecutive *calendar* days that are all Workdays.** `findBridges` builds a
candidate with `addDays(workday, i)` and requires every step to be in the Workday set, so a Friday and the
following Monday are never one two-day candidate; they surface as two separate one-day Bridges. Combined
with `BRIDGE_SEARCH.MAX_MULTI_DAY_SIZE = 3`, a four-Workday gap between two Holidays is never bridged in a
single move. Raising the maximum is the lever, not patching the search.

**Efficiency is computed after expansion, not before.** A candidate's `startDate`/`endDate` are pushed
outwards through adjacent Free Days first, capped at `SAFETY_LIMIT` steps each way; only then is
`effectiveDays / ptoDaysNeeded` taken. This is why one PTO Day can score 4.0. A candidate with no adjacent
Free Day at all is rejected outright before any of that.

**`SAFETY_LIMIT` must stay far above any real free run, because a cap that can be reached is a plan
constraint wearing a guard's clothes.** It was 30, and this guide called it "a loop guard, not a plan
constraint", but the expansion loops already terminate on the first day that is neither a weekend nor a
Holiday, so the only genuine runaway is a calendar containing no working day at all. What 30 actually did
was truncate real spans: a company shutdown entered as Custom Holidays over five weeks left the Bridge
beside it reporting a 31-day span where the free run was 38. `getTotalEffectiveDays` consumes exactly those
two dates, so the Summary showed Effective Days 31 next to Longest Vacation 38: two numbers in one
`Metrics` object contradicting each other, the invariant two sections above. Bounding by the Planning Window
instead was the other candidate and is wrong: a span is *meant* to expand into next year's Holidays, which
is why the Metrics see the unfiltered two-year set. 366 is chosen so no free run inside the fetched data can
reach it.

**The two generators are ranking policies over one candidate set, and the set is found once.**
`findPlanningCandidates` enumerates the Workdays and finds the Bridges; `runPlanningPipeline` calls it once
and hands the result to both. They each carried the same four-step prologue until then (the weekend filter,
`getAvailableWorkdays`, `findBridges`, then a selector) on identical arguments, so the whole candidate half
of the engine ran twice per plan. [`pipeline.test.ts`](./pipeline.test.ts) pins it: one `findBridges` call per run.

The weekend filter is gone from both, not moved: `createHolidaySet` drops weekend Holidays itself, and it is
the only consumer of the `holidays` argument in either `getAvailableWorkdays` or `findBridges`, so the
generators' copies were inert. The rule the filter enforced, that a Bridge must not claim credit for absorbing a
Saturday, is enforced there and stated in the cache row above.

`effectivePtoDays = Math.min(availableWorkdays.length, ptoDays)` stays in `generateSuggestions` alone. It is
inert (both selectors add a Bridge only when its PTO Days are unused, so a selection can never exceed the
distinct available Workdays) and giving it to `generateAlternatives` for symmetry would be a behaviour change
wearing a tidy-up's clothes.

**`presorted` is load-bearing, and it now means what it says.** `selectBridgesForStrategy` applies the
Strategy's `Ordering` unless the caller sets `presorted: true`.

**That is a behaviour change for BALANCED Alternatives, and it is deliberate.** The flag used to skip only
the scoring sort; the high-value partition ran regardless, inside the selector. So `generateAlternatives`
supplied a diverse ordering for BALANCED and had it partly reordered underneath, the opposite of what the
flag exists for, and it reduced the distinctness those Alternatives are generated to produce. The ordering
is respected whole now. The set of BALANCED Alternatives a user sees shifts as a result; none of them
becomes wrong. `generateAlternatives` exists to impose its own
orderings, so without the flag every ordering would collapse back to the same greedy result and all seven
"alternatives" would be identical.

It is a precondition the callee cannot check, which normally argues for taking the *ordering* instead of a
claim about it, and that does not work here, so do not re-propose it. Past the seventh comparator
`generateAlternatives` **rotates** an already-sorted array rather than sorting again, and a rotation is not
expressible as a comparator: `presorted: true` is the only way to say "walk exactly this array". The
alternatives are a branded ordered-array type, which buys type safety at the cost of ceremony on the hottest
path in the engine, or a renamed flag, which is the same boolean wearing better clothes. The flag has one
caller and [`generateAlternatives.test.ts`](./alternatives/generateAlternatives.test.ts) pins the distinctness it protects.

**The seventh Alternative ordering sorts on `Math.sin` on purpose.** Six of the comparators in
`generateAlternatives.ts` bias selection along a real axis: Efficiency, span, PTO cost, month, and
Efficiency ascending. The seventh, `Math.sin(efficiency × 1000)`, is a deterministic scramble whose only job
is to surface Bridges every meaningful ordering buries. It looks like a mistake and is not; replacing it with
a seventh sensible axis collapses that Alternative into a near-duplicate of one of the other six.

**Rotation, not re-sorting, produces the Alternatives past the seventh.** `maxAttempts` exceeds the number
of comparators, so once a full cycle is done each further pass rotates the starting index of an
already-sorted variant rather than sorting again. The greedy selector then takes a different Bridge first
and yields a distinct plan from the same order. Sorting afresh would return the same seven results.

**An Alternative can never share a date with the current Suggestion.** `generateAlternatives` filters out
every Bridge overlapping `existingSuggestion` before it starts. That is what keeps the offered plans
genuinely distinct, and also why a strong Bridge in the current plan cannot reappear in any Alternative.

**Bonus Days are measured against days placed, not the budget, and `generateMetrics` no longer takes the
budget at all.** It computes `bonusDays = totalEffectiveDays − days.length`; the baseline is what the plan
actually spent. It used to accept `totalPtoBudget` "so callers that already have it can pass it" and then
never destructure it: an interface with a parameter and no behaviour behind it, which one caller dutifully
supplied and one test existed only to confirm was discarded. Both are gone.

**Gain is the budget-based twin, and it lives in `utils/budget.ts` beside `measureBudget`.** `measureGain`
answers `{ overBudget, gain }` from `totalEffectiveDays` and the whole budget. It was six characters of
arithmetic inside a `useMemo` in [`Summary.tsx`](../../ui/modules/pages/planner/Summary.tsx), a [`CONTEXT.md`](../../../../../CONTEXT.md) term with no
owner and no test, and the thing that makes it worth naming is the denominator: Gain divides by the
**budget**, Efficiency by the **days placed**, so the two coincide only when the plan spends the budget in
full. [`budget.test.ts`](./utils/budget.test.ts) pins that they part company, verified by swapping the denominator.

`overBudget` is deliberately not called a Bonus Day. It is Gain's numerator measured against the budget,
which is a different quantity from the glossary's Bonus Day, and the planner guide explains why the badge
reading it says "over budget" and never the word bonus.

**Removing one day of a Bridge discards the whole Bridge.** `getTotalEffectiveDays` keeps only Bridges
whose every PTO Day is still selected. That filter is `getValidBridges`, shared so nothing can disagree
about which Bridges survive. It then unions their spans (union, not sum, because two Bridges either side of the same
weekend both absorb it, and adding them would count those Free Days twice). Take one day out of a
three-day Bridge and its entire span stops counting, which is why Effective Days can drop by more than one.

**A surviving Bridge's span is re-checked day by day, because the span can outlive what made it free.** The
`ptoDays` filter guards the Bridge's *cost*, never its span's interior, and a Manual Day can only ever enter
a span through `analyzePotentialBridge`'s expansion, since `getAvailableWorkdays` excludes it as a pseudo-Holiday,
so it never appears in `ptoDays` and the filter cannot see it. Hand a Manual Day back and the neighbouring
Bridge stayed valid while its span still ran through a date the calendar had gone back to painting as a
workday, and every metric derived from Effective Days (Bonus Days, Efficiency) was inflated by one per such
day. The union now admits a span day only when it is a weekend, a Holiday, or still placed, which is why
`getTotalEffectiveDays` takes `holidays` as a third argument. A caller that omits it gets the days-only
reading, so `generateMetrics` passes the same unfiltered set it hands every other metric.

**`bridgesUsed` counts the Bridges that survived, not the ones the plan was born with.** It was
`bridges?.length`, taken straight from the array the caller passed, while Effective Days had already
discarded some through `getValidBridges`, so a two-day Bridge with one day removed left the card reading
"Bridges used: 1" beside an Efficiency of exactly 1.0 and no Bonus Days, describing bridging that was no
longer happening. Both numbers now come from `getValidBridges`. `toggleDaySelection` never re-derives
`currentSelection.bridges` and starts no worker run, so the two would otherwise stay out of step until an
unrelated change forced a re-plan.

**`removedDays` reaches `getAvailableWorkdays` and nothing else, on purpose.** A Removed Day is a date the
user has told us they *will work*: the planner must not place it, but it is not a Free Day. Passing it into
`createHolidaySet`, or into `findBridges`, would let `analyzePotentialBridge` count it as adjacent free
time and expand a Bridge through it, inflating `effectiveDays` and therefore Efficiency for every Bridge
that touches it. Dropping the date from the Workday list is the whole mechanism; there is deliberately no
second consumer.

**The metrics year is passed in, not inferred.** `generateMetrics` takes a required `year` and hands it to
`calculateMaxWorkStreak` and `getWorkedDaysPerMonth`, which both scope themselves to one calendar year.
It cannot be derived from the plan: the Planning Window runs into the following year through the Carry-over
Months, so the first placed day may sit in `year + 1`. Nor can it come from `holidays`, since that set spans both
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
scan starts seven days before the earliest date, so a block can open in December of `year - 1`, as every
planning year whose 1 January is a Monday or a Sunday does it, with a PTO Day on the adjacent January
workday. Anchoring on `currentBlock.at(0)` then gave `windowMonthIndex` a negative index, `Math.floor(-1 / 3)`
is `-1`, and the `quarter >= 0` guard threw away a Long Block the plan had paid for, while
`calculateLongWeekends` counted the same stretch and `calculateQuarterDistribution` put the placed day in Q1,
so the Summary's two quarter charts disagreed about the same quarter. `closeBlock` now anchors on
`currentBlock.find((day) => windowMonthIndex(day, window) >= 0)`; the guard stays, so a block lying wholly
outside the window is still dropped.

**Rest Blocks are separated by more than seven days.** Two PTO Days five days apart are one Rest Block even
with Workdays between them. Long Weekends, Longest Vacation and Long Blocks use a different rule entirely:
they scan the real calendar from seven days before the first date to seven days after the last, so a
stretch straddling the edge of the data is still counted whole.

## The cache protocol

`utils/cache.ts` memoises date keys and the Holiday set in module-level maps that are never evicted, and
every production call site stores the Holiday set under the same fixed `'default'` key. A second run
therefore reuses the first run's Holidays unless someone clears it, silently, because a stale Holiday set
is structurally valid.

**`runPlanningPipeline` owns the clear, and nothing else in production calls it.** `clearDateKeyCache()` and
`clearHolidayCache()` open the pipeline. The pipeline is the right owner because it is the only code that
knows where a run begins; a `clear` anywhere below it would evict a set the same run is still using.

**`HOLIDAY_CACHE` earns its keep inside one `findPlanningCandidates` call, not across the two generators.**
That is worth stating because the sharing it was written for has moved: the generators no longer touch it at
all. `createHolidaySet` has exactly two production callers, `getAvailableWorkdays` and `findBridges` in
`utils/helpers.ts`, and `findPlanningCandidates` calls them one after the other on the same Holiday list.
The memoisation is what makes the second call free. Deleting the cache after the prologue hoist was
considered on the grounds that the hoist had left it with nothing to share; it would in fact rebuild the
Holiday set twice on every run. Keep it, and keep the clear where it is.

That is an amendment to [ADR 0006](../../../../../adr/0006-caller-owned-calculation-caches.md), which
originally put the clear at each caller because the orchestration lived at each caller. It no longer does.
`worker.ts` and the holidays store's `generateSuggestions` action now pass inputs and read a result; neither
knows the caches exist, and a new entry point cannot forget a step it never had.

`fetchHolidays` replaces the Holiday set without planning, and `toggleDaySelection` recomputes Metrics, which
reach neither cache, and a `clear` in either would evict a set the next run is about to rebuild anyway.

`getKey` is keyed on `Date.getTime()`, so two `Date` objects for the same day at different times of day
produce two cache entries with the same string value. That is harmless, but it is why every date the engine
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
| `SCORING.BASE_SCORE` | 1 | Neutral multiplier, applied when a Bridge does not qualify for the multi-day bonus |
| `SCORING.MULTI_DAY_BONUS` | 1.5 | Multiplier applied to Bridges meeting both `HIGH_VALUE_THRESHOLD_*` |
| `SCORING.EFFICIENCY` | 0.6 | Weight of the Efficiency term in the `BALANCED` score |
| `SCORING.TOTAL_VALUE` | 0.4 | Weight of the span term (`effectiveDays / VALUE_DIVISOR`) in the `BALANCED` score |
| `SCORING.VALUE_DIVISOR` | 10 | Brings an absolute span onto the same scale as an Efficiency ratio, so the two weights above mean what they say |
| `SELECTION_WEIGHTS.HIGH_VALUE_THRESHOLD_DAYS` | 3 | PTO Days. At or above this a Bridge is "high value" for the two-pass selector |
| `SELECTION_WEIGHTS.HIGH_VALUE_THRESHOLD_EFFECTIVE` | 9 | Effective Days. Same role, on the span rather than the cost; a Bridge must clear both |
| `EFFICIENCY.ACCEPTABLE` | 2.5 | Efficiency ratio a Bridge must also reach to be "high value" in the `BALANCED` first pass |
| `EFFICIENCY.MINIMUM` | 2 | Admission floor: below this ratio a candidate is not a Bridge at all. Strategy-agnostic: `OPTIMIZED` ranks by Efficiency first but admits the same population as the others |
| `BRIDGE_SEARCH.MIN_MULTI_DAY_SIZE` | 2 | Consecutive Workdays. Smallest multi-day candidate tried, in addition to the single-day ones |
| `BRIDGE_SEARCH.MAX_MULTI_DAY_SIZE` | 3 | Consecutive Workdays. Largest multi-day candidate tried; see the first trap above |
| `METRICS.LONG_BLOCK_MINIMUM_DAYS` | 3 | Consecutive days. Below this a Rest Block is not a Long Block |
| `METRICS.LONG_WEEKEND_MINIMUM_DAYS` | 3 | Consecutive Free Days. The floor for a Long Weekend, which must also contain a weekend and a placed day |
| `METRICS.REST_BLOCK_SEPARATION_DAYS` | 7 | Days. Two placed days further apart than this are separate Rest Blocks. **Not the same seven** as the scan margin below, and they are free to move independently |
| `METRICS.STREAK_SCAN_MARGIN_DAYS` | 7 | Days. How far either side of the data `freeStreaks` scans, so a stretch straddling the edge is still counted whole |

## Testing

Every module has a co-located `.test.ts`. Inputs are literal `Date` and `HolidayDTO` values and assertions
are on returned values; there is nothing to mock, with one exception below.

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
`describe` in these files starts with the two clears, even when its cases look like they have no Holidays
in them.

That covers `generateSuggestions.test.ts`, `generateAlternatives.test.ts`, `utils/helpers.test.ts`,
`utils/cache.test.ts` and `suggestions/utils/selectors.test.ts`, which drives selectors that key their
used-date sets with `getKey`. It does **not** cover the third entry point: nothing under `metrics/` imports
the cache module, because `generateMetrics` reaches only `utils/selection.ts` and `metrics/utils/helpers.ts`
and both match dates with `toDateString()`. Adding a clear there would be dead code, so [`generateMetrics.test.ts`](./metrics/generateMetrics.test.ts)
and [`metrics/utils/helpers.test.ts`](./metrics/utils/helpers.test.ts) have none; do not "restore" it.

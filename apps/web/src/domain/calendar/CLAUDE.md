# apps/web/src/domain/calendar

## Purpose

The planning engine. Given a Planning Window, a set of Holidays and a PTO budget, it finds the Bridges that
turn that budget into the longest stretches away from work, picks a set of them under the chosen Strategy,
offers Alternatives, and measures the result. Pure functions throughout — same inputs, same output, no
clock beyond `startOfToday()`, no I/O. The layer contract it sits under is in [`../CLAUDE.md`](../CLAUDE.md)
([ADR 0003](../../../../../adr/0003-pure-calendar-domain-effectful-payment-domain.md)); the words it uses are
in [`CONTEXT.md`](../../../../../CONTEXT.md).

## Files

| File | Contents |
| --- | --- |
| `types.ts` | `Bridge`, `Suggestion`, `Metrics`, `FirstLastBreak`, and the `FilterStrategy` const object plus its type |
| `const.ts` | `PTO_CONSTANTS` — every tunable in the engine; the unit and meaning of each are in [Constants](#constants) below |
| `utils/cache.ts` | `getKey`, `getCombinationKey`, `createHolidaySet`, and the two `clear*` functions the caller must use |
| `utils/helpers.ts` | `getAvailableWorkdays` (Workday enumeration) and `findBridges` (candidate generation and ranking) |
| `utils/selection.ts` | `resolveSelectedDays` — folds Manual Days in and Removed Days out of a Suggestion's day list |
| `utils/budget.ts` | `measureBudget` — how much of the PTO budget a plan has spent, and the Remaining Budget |
| `suggestions/generateSuggestions.ts` | The entry point: Workdays → Bridges → Strategy selector → Suggestion |
| `suggestions/utils/selectors.ts` | `selectBridgesForStrategy` (Grouped, Optimized) and `selectOptimalDaysFromBridges` (Balanced) |
| `pipeline.ts` | `runPlanningPipeline` — the whole run: caches, pseudo-Holidays, budget, the two planning calls and the Metrics |
| `alternatives/generateAlternatives.ts` | Re-runs selection under seven different Bridge orderings to produce distinct Alternatives |
| `metrics/generateMetrics.ts` | Assembles the `Metrics` object for a Suggestion or an Alternative |
| `metrics/utils/streaks.ts` | `freeStreaks` — the one scan of the free-day runs the plan produces |
| `metrics/utils/helpers.ts` | One function per metric — Long Weekends, Rest Blocks, Max Work Streak, Longest Vacation, Worked Days per month, quarterly and monthly distribution — plus `MONTHS_IN_YEAR`, `MONTHS_IN_QUARTER` and the three `window*` helpers that size those distributions |

## Public API

**`runPlanningPipeline` is the entry point the outside world calls.** One function, one input object, one
result:

```
runPlanningPipeline({ year, ptoDays, autoSuggestCount?, holidays, manuallySelectedDays?,
                      removedSuggestedDays?, allowPastDays, months, strategy, locale, maxAlternatives })
  → { planned, suggestion, alternatives }
```

It owns everything a run needs and a caller used to have to remember: clearing both caches, turning Manual
Days into `manual-N` pseudo-Holidays, deriving `carryOverMonths` from `months.length`, computing
`effectivePtoDays`, short-circuiting when there is nothing to plan, and measuring the Suggestion and every
Alternative with the same arguments. `planned: false` is the short circuit — the suggestion it carries is
empty but its Metrics are real, measured by the engine, so no caller has to invent a zeroed object.

**`PlanningResult` is a discriminated union, and everything in it is a `MeasuredSuggestion`.** `Suggestion`
declares `metrics?` because the two generators produce one without Metrics; this pipeline never does, on
either branch. Saying so in the type is what lets the stores and the whole planner screen read
`suggestion.metrics.totalEffectiveDays` rather than `metrics?.x ?? 0` — six files used to guard against a
state this producer cannot be in, which turns a genuine regression into a silent zero instead of a type
error. `MeasuredSuggestion` is `Suggestion & { metrics: Metrics }` and it travels: the worker's wire type
requires `metrics`, `deserializeSuggestion` returns one, and `HolidaysState` holds them. The one place that
has to earn it is rehydration — `onRehydrateStorage` drops a persisted Suggestion with no Metrics rather
than pretending, because a stored blob is the only input the type cannot vouch for.

The three generators below are still exported and still tested on their own, but nothing outside the domain
calls them directly:

- `generateSuggestions({ ptoDays, holidays, allowPastDays, months, strategy, removedDays? })` → `{ days, bridges?, strategy }`
- `generateAlternatives({ …, maxAlternatives, existingSuggestion, removedDays? })` → `Suggestion[]`
- `generateMetrics({ suggestion, locale, year, bridges, holidays, allowPastDays, manuallySelectedDays, removedSuggestedDays, carryOverMonths? })` → `Metrics`

**`measureBudget` is the one place the budget arithmetic lives, and it is built on `resolveSelectedDays` so it
cannot disagree with the Metrics.** It answers `{ suggested, manual, spent, remaining }` for a budget and a
plan; `spent` is exactly `resolveSelectedDays(...).length`, which is the same denominator Efficiency uses, and
`remaining` is the Remaining Budget as [`CONTEXT.md`](../../../../../CONTEXT.md) defines it — clamped at zero. That
arithmetic used to be written out at four call sites plus a fifth copy behind a store action nothing called;
the store action was the only one with tests. `toggleDaySelection`, `PlannerPanel`'s status readout and the
sidebar's budget control all route through this now. A new caller asking "how many days are left" imports
this rather than subtracting two lengths.

`resolveSelectedDays` is the fourth export the outside world uses: `generateMetrics` applies it to its own
input, and `CalendarExport.tsx` applies it again so the exported calendar contains exactly the days the
Metrics were computed from. It matches on `toDateString()`, so a `Date` carrying a time component still
lines up, and it returns the original array unchanged when there are no Manual or Removed Days. Everything
else under `utils/` and `suggestions/utils/` is internal.

**Both `manuallySelectedDays` and `removedSuggestedDays` are required, and neither defaults.** They used to
default to `[]`, and a caller that omitted them got Metrics measured against the days
the engine placed *by itself*, while `getTotalEffectiveDays` still counts Bridge spans that ran straight
through the Manual Days — the pseudo-Holidays make them Free Days for the expansion. Efficiency
(`totalEffectiveDays / days.length`) and Bonus Days (`totalEffectiveDays - days.length`) were then inflated by
every Manual Day a span covered, and so were the monthly and quarterly distributions. Both planning pipelines
omitted them once, while `toggleDaySelection` passed them, so the same unchanged plan reported two different
Efficiency figures depending on which path had last written the Metrics — toggling a day on and off again was
enough to make the number jump. The mirrored blocks in `worker.test.ts` and `holidays.test.ts` pin it on both
sides.

Neither planning entry point takes a `year`: the Planning Window is carried entirely by `months`.
`generateMetrics` is the one that needs it, because Max Work Streak and Worked Days per month are scoped to
a single calendar year — see the trap below.

## The pipeline, in order

1. `generateSuggestions` drops Holidays that fall on a weekend. They are already Free Days, and keeping
   them would let a Bridge claim credit for absorbing a Saturday.
2. `getAvailableWorkdays` walks each entry of `months` day by day and keeps the Workdays — not a weekend,
   not a Holiday, not one of `removedDays`, and (unless `allowPastDays`) not before today. `months` *is*
   the Planning Window: this function has no other notion of range, and a duplicated month yields
   duplicated Workdays.
3. `findBridges` generates candidates of 1, 2 and 3 consecutive Workdays, expands each candidate outwards
   through the Free Days on either side, computes `effectiveDays / ptoDaysNeeded`, and keeps the candidate
   only if that ratio reaches `EFFICIENCY.MINIMUM`. Duplicates are collapsed by their PTO-day set, keeping
   the most efficient. The result is sorted by Efficiency, with differences under
   `EFFICIENCY_COMPARISON_THRESHOLD` treated as a tie and broken by `effectiveDays` — the ratio is a float
   division, so an exact comparison would order equivalent Bridges on rounding noise.
4. The Strategy selector walks that order greedily, taking any Bridge that fits the remaining budget and
   does not reuse a date already taken.
5. `generateMetrics` measures the outcome — separately, from the day list, not from the selector.

## Strategies

`FilterStrategy` has three values, and all three admit the same population of Bridges — the `MINIMUM`
efficiency floor is applied in `findBridges`, before any Strategy sees the candidates. What differs is
only the order the greedy pass walks them in.

| Strategy | Order |
| --- | --- |
| `GROUPED` | Most PTO Days first, Efficiency as the tie-break — longest blocks win |
| `OPTIMIZED` | Efficiency first, but differences within `EFFICIENCY_COMPARISON_THRESHOLD` count as a tie and the longer stretch wins |
| `BALANCED` | Scored, then selected in two passes |

`BALANCED` scores each Bridge as `(efficiency × 0.6 + effectiveDays / 10 × 0.4) × bonus`, where `bonus` is
`MULTI_DAY_BONUS` for Bridges meeting both `HIGH_VALUE_THRESHOLD_*` and `BASE_SCORE` otherwise. The `/ 10`
brings an absolute span onto the same scale as a ratio, so the two weights mean what they say. It then
fills from the high-value Bridges first and only afterwards from the rest, so a crowd of one-day Bridges
cannot squeeze out a long block. An unknown Strategy value falls through to `GROUPED` — but only in `generateSuggestions`, which looks the
value up with `Object.hasOwn` and falls back to `DEFAULT_STRATEGY`. `generateAlternatives` routes anything
that is not `BALANCED` into `selectBridgesForStrategy`, whose `switch` defaults to
`selectOptimalDaysFromBridges`, so there an unknown value is selected *as* `BALANCED`. That is reachable:
`worker.ts` casts the incoming string to `FilterStrategy` without checking it, so one bad value yields a
Grouped Suggestion beside Balanced Alternatives.

Those are the only two passes. A third used to run after them and could select nothing at all, because both
earlier passes leave the budget short only when every remaining Bridge conflicts with one already taken.
`selectors.test.ts` pins that state deliberately — leaving budget unspent is the correct outcome, not a gap
to fill.

## Invariants and traps

**`generateMetrics` must see exactly the Holiday list the engine planned against — the whole two-year set,
unfiltered.** It is tempting to narrow it to `isInSelectedRange`, and that was tried and reverted. The
planning calls receive the unfiltered list, `createHolidaySet` applies no window filter, and
`analyzePotentialBridge` expands a Bridge's span straight through a next-year Holiday; `getTotalEffectiveDays`
then reports that expanded span. Filtering only the *Metrics* input leaves Longest Vacation, Long Weekends
and Long Blocks scanning a calendar missing the very day the span was built on, so they contradict Effective
Days inside the same Metrics object. Whatever the engine plans against, the Metrics measure against.

That rule leaves the Metrics seeing Holidays from outside the Planning Window, and **the placed-day test is
what stops them being counted as the plan's own work**: a stretch scores only when it contains a day the plan
actually placed, not merely any free weekday. Holidays still extend a stretch — that is what a Bridge is for
— but a run that next year's public Holidays form on their own no longer counts. This is the standard
[`CONTEXT.md`](../../../../../CONTEXT.md) sets for Longest Vacation, *the longest stretch the plan produces*, and
it is why the fix belongs in the streak test rather than in the Holiday list the engine is handed.

**Three metrics walk the free-day runs, and they walk them once — in the source and now in the run.**
`generateMetrics` calls `freeStreaks` once and hands the `FreeStreak[]` to all three; the helpers take the
array, not the inputs to rebuild it from. They each called it themselves until a spy over one
`runPlanningPipeline` counted 33 scans where 11 were needed, one per plan. A fourth streak-derived metric is
a predicate over an array the caller already holds, and costs no scan at all.

`freeStreaks` builds the placed-day set, unions it with the Holidays, expands seven days either side of the data and yields each unbroken run of Free
Days with two facts attached: whether it contains a day the plan placed, and whether it contains a weekend.
Longest Vacation, Long Weekends and Long Blocks are then predicates over that sequence — `hasPlacedDay`,
`length >= 3 && hasWeekend && hasPlacedDay`, and `length >= 3` anchored on the first day inside the window.

Each used to own its copy: three near-identical loops and five separate constructions of the same
"placed days ∪ Holidays" set. That is how the placed-day rule below came to be applied by one and not the
other. A new metric about stretches of time off belongs here as a predicate, not as a fourth loop.

**`calculateLongWeekends` and `calculateLongestVacation` both apply it, and for a while only the first did.**
Longest Vacation folded every free run into its maximum as the streak grew, so it reported whatever the
longest holiday-and-weekend run in the two-year set happened to be — including one lying entirely in
`year + 1`, on which the plan spends nothing. A Catalan 2026 plan placing a single July day reported a
Longest Vacation of 4, from Good Friday to Easter Monday 2027. It now tracks whether the current streak has
touched a placed day and folds the streak in only on close, which is also why the final streak has to be
closed after the loop rather than inside it.

**The distributions are bucketed by the Planning Window, not the calendar year.** `getMonthlyDist`,
`calculateQuarterDistribution` and `getLongBlocksPerQuarter` all take the window and size themselves from
it: `MONTHS_IN_YEAR + carryOverMonths` buckets for the months, and that count divided into
`MONTHS_IN_QUARTER` for the quarters. `windowMonthIndex` places a date at `(year(date) - year) * 12 +
month(date)`, so 5 January 2027 inside a 2026 window lands in bucket 12 rather than folding into January
2026 — two months twelve months apart used to be added together. A date outside the window is dropped, not
clamped.

Neither planning entry point passes `carryOverMonths` on the wire: both derive it as `months.length -
MONTHS_IN_YEAR`, because `months` already *is* the window. Charts must therefore treat these arrays as
variable-length — `MonthlyDistributionChart` already did, and the two quarter charts index
`COLOR_SCHEMES` modulo its length, since four brand colours no longer cover every bucket.

**A multi-day Bridge is consecutive *calendar* days that are all Workdays.** `findBridges` builds a
candidate with `addDays(workday, i)` and requires every step to be in the Workday set, so a Friday and the
following Monday are never one two-day candidate — they surface as two separate one-day Bridges. Combined
with `BRIDGE_SEARCH.MAX_MULTI_DAY_SIZE = 3`, a four-Workday gap between two Holidays is never bridged in a
single move. Raising the maximum is the lever, not patching the search.

**Efficiency is computed after expansion, not before.** A candidate's `startDate`/`endDate` are pushed
outwards through adjacent Free Days first, capped at `SAFETY_LIMIT` steps each way; only then is
`effectiveDays / ptoDaysNeeded` taken. This is why one PTO Day can score 4.0. A candidate with no adjacent
Free Day at all is rejected outright before any of that.

**`SAFETY_LIMIT` must stay far above any real free run, because a cap that can be reached is a plan
constraint wearing a guard's clothes.** It was 30, and this guide called it "a loop guard, not a plan
constraint" — but the expansion loops already terminate on the first day that is neither a weekend nor a
Holiday, so the only genuine runaway is a calendar containing no working day at all. What 30 actually did
was truncate real spans: a company shutdown entered as Custom Holidays over five weeks left the Bridge
beside it reporting a 31-day span where the free run was 38. `getTotalEffectiveDays` consumes exactly those
two dates, so the Summary showed Effective Days 31 next to Longest Vacation 38 — two numbers in one
`Metrics` object contradicting each other, the invariant two sections above. Bounding by the Planning Window
instead was the other candidate and is wrong: a span is *meant* to expand into next year's Holidays, which
is why the Metrics see the unfiltered two-year set. 366 is chosen so no free run inside the fetched data can
reach it.

**`presorted` is load-bearing.** `selectBridgesForStrategy` and `selectOptimalDaysFromBridges` re-sort
their input unless the caller sets `presorted: true`. `generateAlternatives` exists to impose its own
orderings, so without the flag every ordering would collapse back to the same greedy result and all seven
"alternatives" would be identical.

It is a precondition the callee cannot check, which normally argues for taking the *ordering* instead of a
claim about it — and that does not work here, so do not re-propose it. Past the seventh comparator
`generateAlternatives` **rotates** an already-sorted array rather than sorting again, and a rotation is not
expressible as a comparator: `presorted: true` is the only way to say "walk exactly this array". The
alternatives are a branded ordered-array type, which buys type safety at the cost of ceremony on the hottest
path in the engine, or a renamed flag, which is the same boolean wearing better clothes. The flag has one
caller and `generateAlternatives.test.ts` pins the distinctness it protects.

**The seventh Alternative ordering sorts on `Math.sin` on purpose.** Six of the comparators in
`generateAlternatives.ts` bias selection along a real axis — Efficiency, span, PTO cost, month, and
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

**Bonus Days are measured against days placed, not the budget.** `generateMetrics` computes
`bonusDays = totalEffectiveDays − days.length`. `totalPtoBudget` is accepted so callers that already have
it can pass it, and is deliberately ignored — the baseline is what the plan actually spent.

**Removing one day of a Bridge discards the whole Bridge.** `getTotalEffectiveDays` keeps only Bridges
whose every PTO Day is still selected — that filter is `getValidBridges`, shared so nothing can disagree
about which Bridges survive — then unions their spans (union, not sum — two Bridges either side of the same
weekend both absorb it, and adding them would count those Free Days twice). Take one day out of a
three-day Bridge and its entire span stops counting, which is why Effective Days can drop by more than one.

**A surviving Bridge's span is re-checked day by day, because the span can outlive what made it free.** The
`ptoDays` filter guards the Bridge's *cost*, never its span's interior, and a Manual Day can only ever enter
a span through `analyzePotentialBridge`'s expansion — `getAvailableWorkdays` excludes it as a pseudo-Holiday,
so it never appears in `ptoDays` and the filter cannot see it. Hand a Manual Day back and the neighbouring
Bridge stayed valid while its span still ran through a date the calendar had gone back to painting as a
workday, and every metric derived from Effective Days — Bonus Days, Efficiency — was inflated by one per such
day. The union now admits a span day only when it is a weekend, a Holiday, or still placed, which is why
`getTotalEffectiveDays` takes `holidays` as a third argument. A caller that omits it gets the days-only
reading, so `generateMetrics` passes the same unfiltered set it hands every other metric.

**`bridgesUsed` counts the Bridges that survived, not the ones the plan was born with.** It was
`bridges?.length`, taken straight from the array the caller passed, while Effective Days had already
discarded some through `getValidBridges` — so a two-day Bridge with one day removed left the card reading
"Bridges used: 1" beside an Efficiency of exactly 1.0 and no Bonus Days, describing bridging that was no
longer happening. Both numbers now come from `getValidBridges`. `toggleDaySelection` never re-derives
`currentSelection.bridges` and starts no worker run, so the two would otherwise stay out of step until an
unrelated change forced a re-plan.

**`removedDays` reaches `getAvailableWorkdays` and nothing else, on purpose.** A Removed Day is a date the
user has told us they *will work*: the planner must not place it, but it is not a Free Day. Passing it into
`createHolidaySet` — or into `findBridges` — would let `analyzePotentialBridge` count it as adjacent free
time and expand a Bridge through it, inflating `effectiveDays` and therefore Efficiency for every Bridge
that touches it. Dropping the date from the Workday list is the whole mechanism; there is deliberately no
second consumer.

**The metrics year is passed in, not inferred.** `generateMetrics` takes a required `year` and hands it to
`calculateMaxWorkStreak` and `getWorkedDaysPerMonth`, which both scope themselves to one calendar year.
It cannot be derived from the plan: the Planning Window runs into the following year through the Carry-over
Months, so the first placed day may sit in `year + 1`. Nor can it come from `holidays` — that set spans both
years, may carry Custom Holidays anywhere, and is empty when there are none. For the same reason
`getWorkedDaysPerMonth` subtracts only the Holidays and PTO Days whose own year matches: the denominator is
one calendar year, and the Carry-over Months put PTO outside it.

**`allowPastDays` may only trim the metric year's own start.** `calculateMaxWorkStreak` scans from
`startOfToday()` instead of 1 January when the past is excluded — but only while today falls inside the
year. Without that clamp, planning a future year would start the scan at today and report every workday
between now and January as one uninterrupted streak.

**A Long Block counts the Free Days a Bridge absorbs, not just the PTO Days.** `getLongBlocksPerQuarter`
scans the real calendar and treats weekends and Holidays as part of the run, so a Friday plus the following
Monday is one four-day Long Block rather than two isolated PTO Days.

**A Long Block is filed under the first of its days that lies *inside* the window, not its first day.** The
scan starts seven days before the earliest date, so a block can open in December of `year - 1` — every
planning year whose 1 January is a Monday or a Sunday does it, with a PTO Day on the adjacent January
workday. Anchoring on `currentBlock.at(0)` then gave `windowMonthIndex` a negative index, `Math.floor(-1 / 3)`
is `-1`, and the `quarter >= 0` guard threw away a Long Block the plan had paid for — while
`calculateLongWeekends` counted the same stretch and `calculateQuarterDistribution` put the placed day in Q1,
so the Summary's two quarter charts disagreed about the same quarter. `closeBlock` now anchors on
`currentBlock.find((day) => windowMonthIndex(day, window) >= 0)`; the guard stays, so a block lying wholly
outside the window is still dropped.

**Rest Blocks are separated by more than seven days.** Two PTO Days five days apart are one Rest Block even
with Workdays between them. Long Weekends, Longest Vacation and Long Blocks use a different rule entirely —
they scan the real calendar from seven days before the first date to seven days after the last, so a
stretch straddling the edge of the data is still counted whole.

## The cache protocol

`utils/cache.ts` memoises date keys and the Holiday set in module-level maps that are never evicted, and
every production call site stores the Holiday set under the same fixed `'default'` key. A second run
therefore reuses the first run's Holidays unless someone clears it — silently, because a stale Holiday set
is structurally valid.

**`runPlanningPipeline` owns the clear, and nothing else in production calls it.** `clearDateKeyCache()` and
`clearHolidayCache()` open the pipeline; they must not move into a *generator*, because one run calls
`generateSuggestions` and `generateAlternatives` separately and both must see the same memoised set, so
clearing there would destroy the sharing the caches exist for. The pipeline sits above both, which is what
makes it the right owner — it is the only code that knows where a run begins.

That is an amendment to [ADR 0006](../../../../../adr/0006-caller-owned-calculation-caches.md), which
originally put the clear at each caller because the orchestration lived at each caller. It no longer does.
`worker.ts` and the holidays store's `generateSuggestions` action now pass inputs and read a result; neither
knows the caches exist, and a new entry point cannot forget a step it never had.

`fetchHolidays` replaces the Holiday set without planning, and `toggleDaySelection` recomputes Metrics, which
reach neither cache — a `clear` in either would evict a set the next run is about to rebuild anyway.

`getKey` is keyed on `Date.getTime()`, so two `Date` objects for the same day at different times of day
produce two cache entries with the same string value — harmless, but it is why every date the engine
constructs is at local midnight.

## Constants

Every tunable lives in `PTO_CONSTANTS` in `const.ts`. A magic number anywhere else in this folder is a
defect: add the field instead. Changing one changes the plans users see, so treat an edit here as a
behaviour change and expect the selector tests to move.

| Field | Value | Unit and meaning |
| --- | --- | --- |
| `SAFETY_LIMIT` | 366 | Days. The most a Bridge boundary may expand backwards or forwards through Free Days. A loop guard, and it has to be set high enough to stay one — see the trap below |
| `BRIDGE_GENERATION.EFFICIENCY_COMPARISON_THRESHOLD` | 0.1 | Efficiency ratio. Differences smaller than this count as a tie and are resolved by `effectiveDays` |
| `SCORING.BASE_SCORE` | 1 | Neutral multiplier, applied when a Bridge does not qualify for the multi-day bonus |
| `SCORING.MULTI_DAY_BONUS` | 1.5 | Multiplier applied to Bridges meeting both `HIGH_VALUE_THRESHOLD_*` |
| `SCORING.EFFICIENCY` | 0.6 | Weight of the Efficiency term in the `BALANCED` score |
| `SCORING.TOTAL_VALUE` | 0.4 | Weight of the span term (`effectiveDays / 10`) in the `BALANCED` score |
| `SELECTION_WEIGHTS.HIGH_VALUE_THRESHOLD_DAYS` | 3 | PTO Days. At or above this a Bridge is "high value" for the two-pass selector |
| `SELECTION_WEIGHTS.HIGH_VALUE_THRESHOLD_EFFECTIVE` | 9 | Effective Days. Same role, on the span rather than the cost — a Bridge must clear both |
| `EFFICIENCY.ACCEPTABLE` | 2.5 | Efficiency ratio a Bridge must also reach to be "high value" in the `BALANCED` first pass |
| `EFFICIENCY.MINIMUM` | 2 | Admission floor: below this ratio a candidate is not a Bridge at all. Strategy-agnostic — `OPTIMIZED` ranks by Efficiency first but admits the same population as the others |
| `BRIDGE_SEARCH.MIN_MULTI_DAY_SIZE` | 2 | Consecutive Workdays. Smallest multi-day candidate tried, in addition to the single-day ones |
| `BRIDGE_SEARCH.MAX_MULTI_DAY_SIZE` | 3 | Consecutive Workdays. Largest multi-day candidate tried — see the first trap above |

## Testing

Every module has a co-located `.test.ts`. Inputs are literal `Date` and `HolidayDTO` values and assertions
are on returned values — there is nothing to mock, with one exception below.

Fixtures share January 2025 as their reference month, because its shape exercises every case by hand: Jan 3
is a Friday, Jan 4 and Jan 5 the weekend, Jan 6 to Jan 10 Monday through Friday, and the month holds 23
Workdays. A new case belongs in that month unless it is specifically about year boundaries or quarters.

`generateSuggestions.test.ts` is the exception: it wraps the two selectors in `vi.fn(actual.…)` spies rather
than replacing them, so every other case still runs the real selection while the Strategy-to-selector wiring
stays assertable.

Any test whose subject reaches `getKey` or `createHolidaySet` **must** call `clearDateKeyCache()` and
`clearHolidayCache()` in `beforeEach`. Without it a case inherits the previous case's Holiday set and
passes or fails for reasons that have nothing to do with what it asserts. `cache.test.ts` pins that
behaviour deliberately, including the case proving a second `createHolidaySet` call ignores its new
argument.

**The rule is per `describe`, not per file, and one block was missing it.**
`describe('findBridges efficiency floor')` in `utils/helpers.test.ts` had no `beforeEach`, so every case in
it ran against whatever Holiday set the block above had left behind — invisibly, because its cases pass
`holidays: []` and happened to assert things the stale set did not disturb. The first case added there that
actually depended on its own Holidays failed with a span truncated by a set it never passed. A new
`describe` in these files starts with the two clears, even when its cases look like they have no Holidays
in them.

That covers `generateSuggestions.test.ts`, `generateAlternatives.test.ts`, `utils/helpers.test.ts`,
`utils/cache.test.ts` and `suggestions/utils/selectors.test.ts`, which drives selectors that key their
used-date sets with `getKey`. It does **not** cover the third entry point: nothing under `metrics/` imports
the cache module, because `generateMetrics` reaches only `utils/selection.ts` and `metrics/utils/helpers.ts`
and both match dates with `toDateString()`. Adding a clear there would be dead code, so `generateMetrics.test.ts`
and `metrics/utils/helpers.test.ts` have none — do not "restore" it.

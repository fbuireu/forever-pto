# src/domain/calendar

## Purpose

The planning engine. Given a Planning Window, a set of Holidays and a PTO budget, it finds the Bridges that
turn that budget into the longest stretches away from work, picks a set of them under the chosen Strategy,
offers Alternatives, and measures the result. Pure functions throughout — same inputs, same output, no
clock beyond `startOfToday()`, no I/O. The layer contract it sits under is in [`../CLAUDE.md`](../CLAUDE.md)
([ADR 0003](../../../docs/adr/0003-pure-calendar-domain-effectful-payment-domain.md)); the words it uses are
in [`CONTEXT.md`](../../../CONTEXT.md).

## Files

| File | Contents |
| --- | --- |
| `types.ts` | `Bridge`, `Suggestion`, `Metrics`, `FirstLastBreak`, and the `FilterStrategy` const object plus its type |
| `const.ts` | `PTO_CONSTANTS` — every tunable in the engine; the unit and meaning of each are in [Constants](#constants) below |
| `utils/cache.ts` | `getKey`, `getCombinationKey`, `createHolidaySet`, and the two `clear*` functions the caller must use |
| `utils/helpers.ts` | `getAvailableWorkdays` (Workday enumeration) and `findBridges` (candidate generation and ranking) |
| `utils/selection.ts` | `resolveSelectedDays` — folds Manual Days in and Removed Days out of a Suggestion's day list |
| `suggestions/generateSuggestions.ts` | The entry point: Workdays → Bridges → Strategy selector → Suggestion |
| `suggestions/utils/selectors.ts` | `selectBridgesForStrategy` (Grouped, Optimized) and `selectOptimalDaysFromBridges` (Balanced) |
| `alternatives/generateAlternatives.ts` | Re-runs selection under seven different Bridge orderings to produce distinct Alternatives |
| `metrics/generateMetrics.ts` | Assembles the `Metrics` object for a Suggestion or an Alternative |
| `metrics/utils/helpers.ts` | One function per metric — Long Weekends, Rest Blocks, Max Work Streak, Longest Vacation, Worked Days per month, quarterly and monthly distribution |

## Public API

Three entry points, all called from outside the domain and never from each other:

- `generateSuggestions({ ptoDays, holidays, allowPastDays, months, strategy, removedDays? })` → `{ days, bridges?, strategy }`
- `generateAlternatives({ …, maxAlternatives, existingSuggestion, removedDays? })` → `Suggestion[]`
- `generateMetrics({ suggestion, locale, year, bridges, holidays, allowPastDays, manuallySelectedDays?, removedSuggestedDays? })` → `Metrics`

`resolveSelectedDays` is the fourth export the outside world uses: `generateMetrics` applies it to its own
input, and `CalendarExport.tsx` applies it again so the exported calendar contains exactly the days the
Metrics were computed from. It matches on `toDateString()`, so a `Date` carrying a time component still
lines up, and it returns the original array unchanged when there are no Manual or Removed Days. Everything
else under `utils/` and `suggestions/utils/` is internal.

**That promise only holds while every caller passes `manuallySelectedDays` and `removedSuggestedDays`, and
`generateMetrics` defaults both to `[]`.** A caller that omits them gets Metrics measured against the days
the engine placed *by itself*, while `getTotalEffectiveDays` still counts Bridge spans that ran straight
through the Manual Days — the pseudo-Holidays make them Free Days for the expansion. Efficiency
(`totalEffectiveDays / days.length`) and Bonus Days (`totalEffectiveDays - days.length`) are then inflated by
every Manual Day a span covers, and so are the monthly and quarterly distributions. Both planning pipelines
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

The cost of that rule is real and is the open question: a Long Weekend that next year's public Holidays form
on their own, with no PTO Day near it, is still counted for a plan that does not touch that year — while
[`CONTEXT.md`](../../../CONTEXT.md) calls Longest Vacation the longest stretch *the plan produces*. Scoping
it properly means requiring a stretch to contain a placed day, not trimming the Holiday list, and that
changes what the Long Weekend card counts. Like the distribution bucketing below, it is a product call and
is written down rather than guessed at.

**`monthlyDist` and `quarterDist` bucket by month alone, so a Carry-over Month folds into the same month of
the planning year.** `getMonthlyDist` and `calculateQuarterDistribution` read `getMonth(date)` and nothing
else, and the arrays are a fixed 12 and 4 long. With `carryOverMonths: 1` a PTO Day placed on 5 January 2027
inside the 2026 Planning Window is counted in the January column beside days from January 2026 — two months
twelve months apart, added together. `generateMetrics` does receive `year`, so the information to separate
them is there.

This is recorded rather than fixed because both repairs change what the chart means, and that is a product
call, not a refactor: filtering the days outside the planning year makes the columns stop summing to the
plan's day count, while widening the arrays to `12 + carryOverMonths` changes the shape every consumer
chart renders. Do not quietly pick one — the same reasoning that keeps the two `Summary.tsx` denominators
apart applies here.

**A multi-day Bridge is consecutive *calendar* days that are all Workdays.** `findBridges` builds a
candidate with `addDays(workday, i)` and requires every step to be in the Workday set, so a Friday and the
following Monday are never one two-day candidate — they surface as two separate one-day Bridges. Combined
with `BRIDGE_SEARCH.MAX_MULTI_DAY_SIZE = 3`, a four-Workday gap between two Holidays is never bridged in a
single move. Raising the maximum is the lever, not patching the search.

**Efficiency is computed after expansion, not before.** A candidate's `startDate`/`endDate` are pushed
outwards through adjacent Free Days first, capped at `SAFETY_LIMIT` steps each way; only then is
`effectiveDays / ptoDaysNeeded` taken. This is why one PTO Day can score 4.0. A candidate with no adjacent
Free Day at all is rejected outright before any of that.

**`presorted` is load-bearing.** `selectBridgesForStrategy` and `selectOptimalDaysFromBridges` re-sort
their input unless the caller sets `presorted: true`. `generateAlternatives` exists to impose its own
orderings, so without the flag every ordering would collapse back to the same greedy result and all seven
"alternatives" would be identical.

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
whose every PTO Day is still selected, then unions their spans (union, not sum — two Bridges either side of
the same weekend both absorb it, and adding them would count those Free Days twice). Take one day out of a
three-day Bridge and its entire span stops counting, which is why Effective Days can drop by more than one.

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

**Rest Blocks are separated by more than seven days.** Two PTO Days five days apart are one Rest Block even
with Workdays between them. Long Weekends, Longest Vacation and Long Blocks use a different rule entirely —
they scan the real calendar from seven days before the first date to seven days after the last, so a
stretch straddling the edge of the data is still counted whole.

## The cache protocol

`utils/cache.ts` memoises date keys and the Holiday set in module-level maps that are never evicted, and
every production call site stores the Holiday set under the same fixed `'default'` key. A second run
therefore reuses the first run's Holidays unless someone clears it — silently, because a stale Holiday set
is structurally valid.

**The caller that owns a run owns the clear.** `clearDateKeyCache()` and `clearHolidayCache()` must be
called before every full calculation, and never from inside the engine: one run calls
`generateSuggestions` and `generateAlternatives` separately and both must see the same memoised set, so
clearing internally would destroy the sharing the caches exist for.

There are two callers, and both must keep clearing:

- `worker.ts` under `@infrastructure/workers` — the path the planner actually uses.
- `holidays.ts` under `@application/stores` — the main-thread path behind the Troubleshooting reset. Its
  `generateSuggestions` action is the only place it clears, because it is the only one of its actions that
  starts a run. `fetchHolidays` replaces the Holiday set without calling the engine, and `toggleDaySelection`
  recomputes Metrics, which reach neither cache; a `clear` in either would evict a set the run that follows
  is about to rebuild anyway.

A third caller means replacing the fixed key with one derived from the Holiday set rather than adding a
third `clear` call. See [ADR 0006](../../../docs/adr/0006-caller-owned-calculation-caches.md).

`getKey` is keyed on `Date.getTime()`, so two `Date` objects for the same day at different times of day
produce two cache entries with the same string value — harmless, but it is why every date the engine
constructs is at local midnight.

## Constants

Every tunable lives in `PTO_CONSTANTS` in `const.ts`. A magic number anywhere else in this folder is a
defect: add the field instead. Changing one changes the plans users see, so treat an edit here as a
behaviour change and expect the selector tests to move.

| Field | Value | Unit and meaning |
| --- | --- | --- |
| `SAFETY_LIMIT` | 30 | Days. The most a Bridge boundary may expand backwards or forwards through Free Days. It is a loop guard, not a plan constraint — without it a very long Holiday streak never terminates the expansion |
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

That covers `generateSuggestions.test.ts`, `generateAlternatives.test.ts`, `utils/helpers.test.ts`,
`utils/cache.test.ts` and `suggestions/utils/selectors.test.ts`, which drives selectors that key their
used-date sets with `getKey`. It does **not** cover the third entry point: nothing under `metrics/` imports
the cache module, because `generateMetrics` reaches only `utils/selection.ts` and `metrics/utils/helpers.ts`
and both match dates with `toDateString()`. Adding a clear there would be dead code, so `generateMetrics.test.ts`
and `metrics/utils/helpers.test.ts` have none — do not "restore" it.

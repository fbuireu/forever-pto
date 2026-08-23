# apps/web/src/ui/modules/pages/planner

## Purpose

The planner screen: twelve-plus month calendars, the Holiday tables, the Alternative switcher, the PTO
budget readout and the analytics. This is where the product's whole surface lives, and — because the
planner runs entirely in the browser ([ADR 0001](../../../../../../../adr/0001-planner-runs-in-the-browser.md))
— where the loop of *filter changes → recalculation → repaint* actually closes.

Nothing here computes a Suggestion. [`CalendarList.tsx`](./CalendarList.tsx) asks `useCalculationsWorker` to run the engine
off the main thread and every other component reads the result back out of the holidays store.

## Sections

`src/app/[locale]/(app)/planner/page.tsx` `dynamic()`-imports seven components and renders them in
this order; the layout adds [`SiteTitle.tsx`](./SiteTitle.tsx) and [`SiteSubtitle.tsx`](./SiteSubtitle.tsx) above them.

| Component | Role |
| --- | --- |
| [`HolidaysList.tsx`](./HolidaysList.tsx) | Tabs over [`HolidaysTable.tsx`](./holidays/HolidaysTable.tsx), one per Holiday Variant. The Custom tab is behind the Premium gate; the Regional tab is inert when the Region has no Holidays |
| [`ManagementBar.tsx`](./ManagementBar.tsx) | Sticky host for [`PlannerPanel.tsx`](./PlannerPanel.tsx). On desktop it renders it inline; on mobile it renders it inside a `vaul` drawer |
| `CalendarList.tsx` | Expands the Planning Window for rendering (`planningWindowMonths`, from `@domain/calendar/window`), owns the Holiday fetch and the worker trigger. Renders one `Calendar` per month. It no longer *owns* the window: the trigger sends `{ year, carryOverMonths }` and the engine expands its own |
| [`Legend.tsx`](./Legend.tsx) | Explains the day colours. Exports `Legend` *and* `LegendItems`, which `ManagementBar` reuses inside the mobile drawer |
| [`Summary.tsx`](./Summary.tsx) | Metric cards plus five charts, all five `dynamic()`-imported from here rather than from the route |
| [`Roadmap.tsx`](./Roadmap.tsx) | Feature map over `RadialNav` and `FeatureList` from `core/animate/components/` |
| [`Contact.tsx`](./Contact.tsx) | The feedback prompt; opens [`shared/contact/ContactModal.tsx`](../../shared/contact/ContactModal.tsx) |

## Subdirectories

| Directory | Contents |
| --- | --- |
| `calendar/` | [`calendar/Calendar.tsx`](./calendar/Calendar.tsx) — one month grid, four selection modes, and nothing that knows what a planner is; [`calendar/usePlannerDayClick.tsx`](./calendar/usePlannerDayClick.tsx) — the planner's click policy, which used to live inside it; [`calendar/utils/helpers.ts`](./calendar/utils/helpers.ts) — `MODIFIERS_CLASS_NAMES` and `getDayClassNames`; [`calendar/utils/refusals.ts`](./calendar/utils/refusals.ts); [`calendar/CalendarListFixture.tsx`](./calendar/CalendarListFixture.tsx) |
| `holidays/` | `holidays/HolidaysTable.tsx` plus [`holidays/components/`](./holidays/components) — [`HolidayRow.tsx`](./holidays/components/HolidayRow.tsx), [`HolidayTableHeader.tsx`](./holidays/components/HolidayTableHeader.tsx), [`HolidayFormModal.tsx`](./holidays/components/HolidayFormModal.tsx) and the two thin callers that configure it, [`DeleteHolidayModal.tsx`](./holidays/components/DeleteHolidayModal.tsx), and the Zod factory in [`holidays/components/schema.ts`](./holidays/components/schema.ts) |
| `summary/` | The five charts, [`summary/MetricCard.tsx`](./summary/MetricCard.tsx), [`summary/SummaryFixture.tsx`](./summary/SummaryFixture.tsx) and [`summary/const.ts`](./summary/const.ts) |
| `utils/` | [`utils/helpers.ts`](./utils/helpers.ts) — Planning Window and calendar-grid construction, workday/weekend counting, and the `MONTHS_IN_YEAR` constant every `12 + carryOverMonths` on this screen is built from; [`utils/modifiers.ts`](./utils/modifiers.ts) — the day predicates |

**Adding and editing a Holiday are one form, `HolidayFormModal`.** They were two 200-line components sharing
their imports, the schema construction, the `useForm` setup, `handleClose`, the date-select narrowing, the
whole refusal chain and both `FormField`s character for character. The duplication was already showing: the
Edit modal imported a *second* translator, `tAdd = useTranslations('modals.addHoliday')`, and rendered the
Add modal's copy for its labels, its placeholder, its footer **and** its refusals.

`Add` and `Edit` are ~35-line callers now: each supplies its icon, its copy namespace and an `onCommit` bound
to its own store action. `onCommit` answers the store's `HolidayOutcome`, or **`null`** — which is how Edit
says "nothing changed" without the shared form needing to know what an edit is. The field chrome is read
from `modals.addHoliday` deliberately rather than accidentally; that namespace is now shared and the honest
follow-up is renaming it, which costs an edit in six bundles.

[`HolidayFormModal.test.tsx`](./holidays/components/HolidayFormModal.test.tsx) is the first test either modal has had: applied, a refusal with copy, a refusal
without copy falling through to the generic error, and the `null` no-op.

**The planner's click policy lives in `calendar/usePlannerDayClick.tsx`, not in the calendar.** `Calendar`
serves three callers and only one of them is the planner: `CalendarList` picks days out of a plan,
`HolidayFormModal` picks a single date and `WorkdayCounterCalendarModal` picks a range. The Premium gate and
the refusal toast were written inside `Calendar.handleDayClick` anyway, so the two modals paid for the
premium store subscription, two extra translators, `SupportButton`, `LockIcon`, `toast` and
`DAY_REFUSAL_COPY` to reach a branch neither of them can take. `Calendar` now calls `onDayToggle?.(date)` in
`NONE` mode and does nothing with the answer; the hook wraps the store action `CalendarList` already had.

The policy is four branches — no Premium, applied, a refusal with copy, a refusal without — and
[`usePlannerDayClick.test.tsx`](./calendar/usePlannerDayClick.test.tsx) drives each one. It is the first test any of them has had; the component was
526 lines and testing a toast through it meant mounting the whole grid.

**Extracting it turned up a fifth branch that could never run**, and it is gone. `handleDayClick` warned
`cannotSelectPastDays` when a day was past, not manual and not suggested — but `isPast(allowPastDays, …)`
already returns `() => false` while past days are allowed, so that condition is *character for character*
the one the render uses to set `disabled` on the cell's `<Button>`. A native disabled button fires no
`onClick`. The two translation keys behind it are deleted from all six bundles.

`calendar/utils/refusals.ts` holds both refusal mappings, and neither is a rule — the rules are in the store.
`DAY_REFUSAL_COPY` is the reason-to-message-key map `Calendar` renders. `describeHolidayRefusal` is the same
idea for the Holiday modals, written as a function rather than a table because its two cases interpolate
different values; it returns `null` for the one refusal that has no copy of its own, and both modals render
their own generic error for that case. Adding a `HolidayRefusal` without a branch there is a compile error,
which is the point: the two modals used to hand-write the same chain and one refusal reached neither.

## Day classification

`utils/modifiers.ts` exports curried predicates (`isHoliday`, `isSuggestion`, `isManuallySelected`,
`isAlternative`, `isCustom`, `isNationalOrRegionalHoliday`, `isPast`, `isToday`, and the range family). `Calendar`
builds them into one `modifiers` object and hands it to `getDayClassNames`, which looks each name up
in `MODIFIERS_CLASS_NAMES`. Adding a day state therefore means three edits: the predicate, the entry in
`modifiers`, and the class-name entry under the same key.

**`Calendar` builds only the states it can answer for itself, and the caller supplies the rest.** Weekend,
Holiday, Custom, national-or-regional, today, past and the whole range family come from what `Calendar`
already has: `holidays`, `allowPastDays`, its own `today` and its own selection. The three that describe a
*plan* (`suggested`, `alternative`, `manuallySelected`) arrive as a `dayStates` prop, which is a
`Partial<Record<DayStateName, (date: Date) => boolean>>`. `CalendarList.tsx` builds all three from the
holidays store; [`holidays/components/HolidayFormModal.tsx`](./holidays/components/HolidayFormModal.tsx) supplies `suggested` alone, so its
single-date picker still shows which dates the plan has already spent;
[`sidebar/components/WorkdayCounterCalendarModal.tsx`](../../sidebar/components/WorkdayCounterCalendarModal.tsx) supplies none.

That prop replaced six of them: `currentSelection`, `alternatives`, `suggestion`, `previewAlternativeIndex`,
`manuallySelectedDays` and `removedSuggestedDays`, and with them the two store-type imports that gave a
component described as knowing "nothing that knows what a planner is" the store's own vocabulary. It also
removed a sentinel that worked by accident: `previewAlternativeIndex` defaulted to `-1`, and `isAlternative`
resolved that as `alternatives[-2]`, `undefined`, `false`. No branch said so; the arithmetic happened to
land outside the array. A caller that omits `dayStates` now paints no plan state because there is no
predicate, which is a reason rather than a coincidence.

`getDayClassNames` therefore types `modifiers` as `Record<string, ((date: Date) => boolean) | undefined>`,
and every lookup inside it was already an optional call.

Precedence inside `getDayClassNames` is not the object order, and reading it as such will mislead you:

1. The loop is skipped entirely when the date is in the `selectedDates` prop or the calendar is
   `disabled`. The `selected` class is appended at the end instead, so it wins outright.
2. `today` short-circuits the loop — when it matches, no other modifier class is applied.
3. Otherwise every matching modifier contributes, in object-key order, except `inRange`, `rangeStart`
   and `rangeEnd`, which are appended afterwards so a range boundary paints over a Holiday.
4. A `disabled` calendar then adds `!opacity-20` / `!opacity-40`, which beats everything above.

Two modifiers carry no class of their own: `nationalOrRegionalHoliday` and `disabled` (which is `isPast`) exist only
so `Calendar`'s click handler can branch on them. Adding an entry for either under the same key would
silently start painting them.

**A mistyped key is a compile error now, and was not.** `MODIFIERS_CLASS_NAMES` was annotated
`Record<string, string>` above its own `as const`, which widened the keys straight back and made every
lookup — including `Legend`'s seven swatches — unchecked; a typo painted nothing, silently. The annotation is
a `satisfies` now, so the keys stay literal. Typing them also exposed four dead lookups: the three quarter
charts indexed the record by `Q1`…`Q4` and the pie chart's legend by a translated label, none of which can
match a day state, so all four always fell through to `entry.color` — and a Tailwind class list is not a
valid SVG `fill` in any case. The fall-throughs are gone.

`isAlternative` deliberately returns `false` for any date already in `currentSelection`: an Alternative
is only ever painted where it *differs* from the applied Suggestion.

**The past-day rule has one author, and it used to have two.** `isPast(allowPastDays, today)` is what
`Calendar` binds as `modifiers.disabled` and what its click handler branches on. `getDayClassNames` used to
take `allowPastDays` and `today` and recompute the same question for its `opacity-60` fade, with the left
operand normalised differently (`startOfDay(date)` in one, the bare `date` in the other), agreeing only
because `getCalendarDays` happens to emit midnight dates. It reads `modifiers.disabled?.(date)` now and both
parameters are gone from `GetDayClassNamesParams`. [`calendar/utils/helpers.test.ts`](./calendar/utils/helpers.test.ts) drives that case
through the real `isPast` rather than through the parameters, which is why it can tell the difference at
all.

## Invariants

**`CalendarList` also *clears* the plan, and that is the other half of the same effect.** Its trigger is
gated on `ptoDays > 0 && holidays.length > 0 && months.length > 0`; when the gate closes the worker is never
asked, and nothing else in the app nulls a Suggestion — `fetchHolidays` writes only `holidays`, on both its
success and its catch branch. So a Country whose Holidays fail to load, or a Region that has none, used to
leave the previous Country's plan painted over a calendar that no longer existed, with no way to re-trigger
a run. The effect now calls `clearCalculation()` when the gate closes **and** a Suggestion is still standing.
The second condition matters: without it, the cold load — where the gate is also closed, because Holidays
have not arrived yet — would clear a plan that was never there and mark the store as having calculated.

**Only `CalendarList.tsx` triggers a calculation.** It fires `triggerCalculation` on any change to
year, PTO budget, Strategy, past-days flag, locale or the Holiday list — and on `planRevision`, which
`setCurrentAlternativeSelection` bumps so that applying a plan re-plans it; see
[`@application/stores/CLAUDE.md`](../../../../application/stores/CLAUDE.md). [`Troubleshooting.tsx`](../homepage/support/Troubleshooting.tsx), which now
lives under `pages/homepage/support/`, is the one other caller and it goes the other way —
`useHolidaysStore().generateSuggestions`, on the main thread. Those are the two *UI* entry points; the two
callers [ADR 0006](../../../../../../../adr/0006-caller-owned-calculation-caches.md) counts are the ones that
own the clear a level down — the Web Worker and the holidays store — and `CalendarList` reaches the first
through `triggerCalculation` while `Troubleshooting` reaches the second directly. A third entry point added
here would silently reuse the previous run's Holiday set and produce a wrong Suggestion with no error.

**`CalendarList` prunes hand-edited days when the Planning Window moves.** `pruneDaysOutsideWindow` runs on
every change to `year` or `carryOverMonths`, before the calculation effect. Without it a Manual Day left in a
year the user has navigated away from keeps counting against the budget — `remainingDays` here subtracts
`manuallySelectedDays.length` unconditionally — so the allowance shrinks with no visible cause and only
recovers on a reload, because the store's other caller is `onRehydrateStorage`.

**Nothing renders real numbers before the stores rehydrate.** `CalendarList`, `ManagementBar` and
`Summary` all gate on `useStoresReady()` and show a `<Skeleton>` until every persisted store reports
hydrated. Rendering store values on the first pass produces a hydration mismatch, not just a flash.

What makes that gate work is that it reports **not ready on its first render, always** — never
`store.persist.hasHydrated()` read during render. `obfuscatedStorage` is synchronous, so persist rehydrates
while the store module is evaluating and `hasHydrated()` is already `true` by the first client render; these
sections are `dynamic()`-imported without `ssr: false`, so the server renders them too, with an empty store.
Seeding the hook's state from `hasHydrated()` therefore made the server emit defaults and the first client
render emit the persisted values — the exact mismatch the gate exists to prevent, with the skeleton never
shown. The status is seeded `false` and raised in an effect, so both sides agree on the first pass.

**Premium is a store read, never a prop.** `PremiumFeature` from `@ui/modules/premium` wraps the gated
parts (the Custom Holiday tab, row editing, the advanced charts) and `Calendar` checks `premiumKey`
directly before honouring a day click. Access is derived from the payment record —
[ADR 0008](../../../../../../../adr/0008-premium-derived-from-payment.md) — so there is no boolean to
thread through props and no point caching one.

**And `PremiumFeature` already answers "is this user a donor" for itself, so no caller re-asks.**
Its first statement is `if (premiumKey) return <>{children}</>`, which is the whole of the gate.
`holidays/HolidaysTable.tsx` used to read `premiumKey` from the store and wrap each `PremiumFeature` in a
`ConditionalWrapper doWrap={!premiumKey}` — a second copy of the same predicate, evaluated a render earlier,
which meant the gate could be opened by either of two reads of one store field. The wrapper, the prop it
threaded to `HolidayCard`, the store read and the memo dependency are gone. `ConditionalWrapper` itself
stays: `calendar/Calendar.tsx` and [`sidebar/components/PtoSalaryCalculator.tsx`](../../sidebar/components/PtoSalaryCalculator.tsx) use it for wrappers that
have no such short-circuit of their own.

## Gotchas

**`Calendar` is not a grid, and the `role="grid"` it used to declare was the only ARIA the pattern got.**
There was no `role="row"`, no `role="gridcell"`, no `columnheader` (the weekday strip is a sibling
*outside* the day container) and, more to the point, no grid keyboard model: a grid promises arrow-key
navigation between cells, and every cell here is an ordinary `<button>` in the tab order. Implementing the
pattern would have meant grouping `getCalendarDays`' flat 42 into weeks, moving the header inside, and
writing roving focus, for a widget that already gives every day a complete accessible name:
`Monday, June 1, 2026`, with the Holiday appended. So the role is gone along with its suppression, and the
labelled buttons stand. The container's `aria-label` went with it: it named the month, which is in every
button's own name already, and `aria-label` on a role-less `div` is ignored. Reintroducing any of it means
implementing the whole pattern, and [`calendar/Calendar.test.tsx`](./calendar/Calendar.test.tsx) fails on a bare grid role.

**The month header is one block, not one per `showNavigation` branch.** The two branches rendered a
character-identical `<h3>` and a Free Day count that differed only by `font-black` against `font-semibold`,
with nothing distinguishing them, and since `CalendarList` passes no `showNavigation`, `font-semibold` is
what the product shows on every month calendar while `font-black` reached the two modals alone. The title
and the count are hoisted out; `showNavigation` now decides only whether the prev/today/next controls
render. Keep it that way: a second fork here is how the first drift happened.

**`today` is state initialised to `null`, not `new Date()`.** `Calendar` sets it in an effect on
mount. The server has no "today" that will still be true on the client, so the first paint has no
today marker and no past-day dimming on purpose. Every predicate taking `today` handles `null`.

**The remaining-days counter freezes during a recalculation, and one module owns the freeze.**
`@ui/hooks/usePlanReadout` keeps a `lastSettledRemaining` ref updated by an effect *with no dependency
array* — it runs every render and snapshots the value only while `isCalculating` is false. That looks like a
mistake and is not: without it the budget readout drops to zero for the length of every worker round-trip.

`Status` in `PlannerPanel.tsx` and [`sidebar/components/PtoDays.tsx`](../../sidebar/components/PtoDays.tsx) each held their own copy of that ref,
that effect, that `useShallow` subscription and that `measureBudget` call — six statements, twice, and this
paragraph was the only thing keeping them in step. They had already drifted in a small way: one passed
`currentSelection.days`, the other `currentSelection?.days`. Both read fields off the hook now, and the
freeze is pinned by [`usePlanReadout.test.ts`](../../../hooks/usePlanReadout.test.ts) rather than by the sentence you are reading. A third readout
gets the frozen number by construction.

**Neither of them computes that number.** The Remaining Budget comes from `measureBudget` in
`@domain/calendar/utils`, which is also what `toggleDaySelection` consults before spending a day — so the
readout and the rule that refuses a day cannot drift. Subtracting `days.length` and `manuallySelectedDays.length`
by hand is how they drifted before, and it also skipped `resolveSelectedDays`, which is the count Efficiency
is measured against.

**"No plan" is not "still loading", and `ManagementBar` keeps them apart.** Its `isReady` requires a
Suggestion with days in it, so a run that legitimately produces nothing — a past year with the past-days
switch off, which is the default and is Premium-gated, so a free user cannot even turn it on — used to leave
the desktop panel as a `<Skeleton loading>` and the mobile drawer as a bare pulse, for ever. `isSettledEmpty` is the distinction, and all three of its terms are load-bearing: stores hydrated, a
calculation has completed at least once (`hasCalculated`, set by `setCalculationResult` and not persisted),
nothing in flight, and still no plan. Without `hasCalculated` the cold load qualifies — `isCalculating` is a
worker-only flag that the Holiday fetch never raises, so the window between hydration and the first run
looked "settled" and the panel vanished on every visit. The panel is then not rendered at all
rather than pretending to load. What it *should* say instead is an open copy question; showing nothing is
merely the honest floor.

**The mobile drawer header reads `previewAlternativeIndex`, not `currentSelectionIndex`.** The two numbers
beside it — Effective Days and Efficiency — come from `allSuggestions[previewAlternativeIndex]`, so labelling
them with the *applied* index meant that paging through Alternatives showed "Option 1" above Option 3's
figures. Whatever index the metrics are read from is the one the label has to name.

**`PlannerPanel` is remounted by `key={previewAlternativeIndex}`.** `ManagementBar` does this so the
entry animations replay when the user pages through Alternatives. Any state added inside `PlannerPanel`
is therefore discarded on every Alternative change.

**Which is why `Alternatives` holds no index of its own.** It used to keep `useState(selectedIndex)` and
write it in both handlers *beside* calling `onPreviewChange`, which reaches the store; the remount above then
re-seeded that state from the prop. The local copy could never hold a value the store did not, so it was a
second source of truth that happened to agree. `currentIndex` is `selectedIndex` now, and
[`PlannerPanel.test.tsx`](./PlannerPanel.test.tsx) pins both halves: a click round-trips through a stand-in store, and a change to
`selectedIndex` with no click still moves the readout. Two dead `= 0` defaults sat on props the same
interface declared required; they are gone too.

**`onPreviewChange` takes an index, not an `AlternativeSelectionBaseParams`.** The store's
`setPreviewAlternativeSelection` destructures `{ index }` and ignores `suggestion`, so the component was
looking up `allSuggestions[newIndex]` to hand over a value nothing read, and paying for it in the handlers'
dependency arrays. `ManagementBar` passes `{ suggestion: null, index }` at the store seam because the shared
param type still requires the field; narrowing that type belongs with the store, not here.
`onSelectionChange` is unchanged, because `setCurrentAlternativeSelection` genuinely uses the Suggestion.

**`PlannerPanel` no longer takes `currentSelection`.** It destructured the prop and never referenced it,
while `ManagementBar` computed a `currentSelection ?? allSuggestions[currentSelectionIndex]` fallback to
supply it. Both are gone; the panel's props are exactly `Alternatives`'.

**`Contact.tsx` reads the `roadmap` namespace, not `contact`.** The `contact` namespace belongs to the
modal in `shared/contact/`. It also imports [`contact.css`](./contact.css), which is global CSS, not a module — the
`.dashed-card` class it defines is visible to the whole app.

**`Summary.tsx` measures against two different denominators, and three of its numbers depend on which.**
`ptoDays` here is the *budget*, read from the filters store; the engine's `Metrics` are computed against the
days the plan actually *placed* (`days.length` in [`generateMetrics.ts`](../../../../domain/calendar/metrics/generateMetrics.ts)). So:

- `gain` comes from `measureGain` in `@domain/calendar/utils/budget` — `(totalEffectiveDays - ptoDays) / ptoDays * 100`, budget-based. It was derived inline here until it got an owner and a test.
- `metrics.averageEfficiency` is `totalEffectiveDays / days.length` — placed-based.
- the badge on the Effective Days card shows `increment`, budget-based, while `yearSummary.totalBonusDays`
  further down shows `metrics.bonusDays`, placed-based.

The two denominators are equal only when the plan spends the whole budget, and it deliberately does not
always — a Removed Day, or a Bridge that no longer fits, leaves budget standing (see
[`@domain/calendar/CLAUDE.md`](../../../../domain/calendar/CLAUDE.md)). Gain is therefore **not** Efficiency
minus one, and the badge is **not** a Bonus Day count as [`CONTEXT.md`](../../../../../../../CONTEXT.md) defines it
— which is why its label says "over budget" and never the word bonus. Collapsing any of these into one
another ships a number that is silently wrong by however much budget went unspent.

**That question is now answered: name the baseline, never align the numbers.** Both figures are correct for
what they measure, so the screen states what each is measured against rather than picking a winner. The
Effective Days badge and the Gain badge interpolate `ptoDays`, and the Efficiency card carries a `hint`
naming the days the plan actually placed. A future change that makes the
two agree by moving a denominator is a regression, not a simplification; the disagreement is information.

**The hint has to be counted the way `generateMetrics` counts, which is not `activeSuggestion.days.length`.**
`toggleDaySelection` never rewrites `currentSelection.days` — it records the edit in `manuallySelectedDays`
and `removedSuggestedDays` and recomputes the Metrics — so the stored day list is the plan as the engine
first placed it, for ever. Efficiency is `totalEffectiveDays / resolveSelectedDays(…).length`, so a hint
reading the raw array named the wrong number the moment anything was hand-edited, which is precisely when a
label naming the baseline earns its place: with no Manual or Removed Days the two agree and nobody needed
the label. `Summary` therefore reads `placedDays` off `usePlanReadout`, which applies `resolveSelectedDays`
with the same two lists the store holds. [`sidebar/components/CalendarExport.tsx`](../../sidebar/components/CalendarExport.tsx) reads the same field — it
wants the array rather than the count, so the exported calendar carries exactly the days the Metrics were
measured from. Anything else on this screen that wants "the days spent" takes it from the hook; those two
used to fold it themselves and this sentence was the whole mechanism keeping them in step.

**The two badges that interpolate `ptoDays` need an ICU plural, and five bundles once lacked one.**
`MIN_PTO_DAYS` is 1, so `metrics.overBudget` and `metrics.perPtoDay` are reachable at a count of one; `en`
survives it because "your 1-day budget" is an attributive, while `es`, `ca`, `it`, `de` and `fr` all put a
bare plural noun after the number. Both keys select the noun with `{ptoDays, plural, one {…} other {…}}` in
every bundle now. A new string interpolating a count belongs in the same shape — see
[`../../../i18n/CLAUDE.md`](../../../i18n/CLAUDE.md).

**`MetricCard` renders `hint` in the compact layout only.** The default branch destructures the prop and
never uses it, so passing a hint to a full-size card is silently dropped rather than misplaced. Every
current caller passing one is compact; a new full-size caller needs the element added, not just the prop.

**`MetricCard` rounds to whole numbers unless told otherwise, and two of these values are fractional.**
`SlidingNumber` runs `value.toFixed(decimalPlaces)`, and the card defaulted every caller to `0` with no way
to override it — so Efficiency arrived as `'1.6'` and rendered `2`, and `workedDaysPerMonth`, which
`getWorkedDaysPerMonth` deliberately returns as `Number.parseFloat(avg.toFixed(1))`, rendered as an integer.
Both now pass `decimalPlaces={1}`. A new fractional metric has to do the same.

**`Calendar` no longer predicts what the store will accept.** Its click handler keeps the two rules it owns —
the Premium gate and the past-day rule, which depend on `premiumKey` and on `today`, neither of which the
store sees — then calls `onDayToggle` and renders whatever refusal comes back through `DAY_REFUSAL_COPY`. It
used to test for a Holiday, a Custom Holiday, a weekend and an exhausted budget *before* calling, so the same
condition existed on both sides of the seam and the store's own answer was discarded. A new refusal is a new
reason in the stores' [`types.ts`](../../../../application/stores/types.ts) plus an entry in that map;
it is never a new branch in the handler. `canSelectMoreDays` is gone from the component's interface for the
same reason — the budget question is answered by the refusal, not predicted by the caller.

**Holiday selection is keyed on the Holiday, never on the row's position.** `getHolidayId` in
`holidays/HolidaysTable.tsx` returns `` `${holiday.id}::${holiday.name}` ``, and it used to append the index
the row was rendered at — which belongs to the *filtered and sorted* list, so typing in the search box or
clicking a column header renamed every selection under it. The checkboxes silently cleared while the toolbar
went on offering "Delete (1)", the delete modal received an empty list, and the edit button rendered above a
modal that was never mounted, because the count came from the Set's size and the modal from a list resolved
by index. Both now come from `selectedHolidaysList`, resolved against `variantHolidays` rather than the
visible rows: the toolbar counts exactly what the modals will act on, a selection scrolled out of view by a
search still counts, and an id left over from a Holiday that no longer exists resolves to nothing and drops
out. The select-all checkbox is the deliberate exception — it reads and writes the *visible* rows, which is
what "select all" means with a filter applied.

**The sortable column headers are buttons inside the `th`, and the `th` carries `aria-sort`.** They were
`<th onClick>`, which no keyboard can reach and which announces no sort state. Anything added to
`holidays/components/HolidayTableHeader.tsx` keeps that shape: the cell's own padding moves to the button
(`p-0` on the `TableHead`, `h-11 px-3` on the button) so the whole cell stays clickable.

**Two unrelated `COLOR_SCHEMES`.** `summary/const.ts` exports an array of four brand CSS variables that
the recharts charts index into; `summary/MetricCard.tsx` declares its own record keyed by colour name.
They are not interchangeable and neither is derived from the other.

**[`YearTimelineChart.tsx`](./summary/YearTimelineChart.tsx) is not a recharts chart.** It is hand-built positioned `div`s using
`Temporal.PlainYearMonth` for month lengths ([ADR 0005](../../../../../../../adr/0005-temporal-polyfill.md)).
The other four charts use recharts and are the reason `Summary.tsx` loads all five through `dynamic()`.

**It spans the Planning Window, not the calendar year, and both halves of that were once wrong.** `segPos`
positioned a segment from `getMonth(date)` and `getDayOfMonth(date)` alone — the year was discarded — over a
hard-coded twelve columns, while `Summary` handed it the raw two-year `holidays` array. So every Holiday of
`year + 1` was painted onto the `year` strip: for ES/2026 the National row marked 26 March, which is Good
Friday **2027** and an ordinary Workday in 2026. The two defects are independent, and filtering alone does
not fix it — with the default `carryOverMonths: 1` the window itself reaches into January of `year + 1`, so
an in-window date there still folded onto the January column. The chart now takes `carryOverMonths` and calls the
engine's own `windowMonthCount` and `windowMonthIndex` rather than restating them. It carried a private
`windowColumn` that was `windowMonthIndex` character for character, kept in step by this sentence; a rule
two files hold and a paragraph reconciles is a rule that will drift.
`Summary` passes `holidaysInWindow`, matching `HolidaysDistributionChart`. A stretch crossing 31 December
now also gets a real width instead of hitting the `Math.max(…, 0.005)` clamp.

**Its month labels repeat, so they cannot be React keys.** With a Carry-over Month the strip shows January
twice, and the header keyed on the localised label. Each cell now carries a `${year}-${month}` key built from
the date it represents.

**A past day stays clickable when it is already a Manual Day or a Suggested Day.** `calendar/Calendar.tsx`
computes each cell's `isDisabled` as the past-day modifier *minus* those two, so a day the plan already
contains can still be edited once its date has gone by. Disabling every past day instead would strand
those days in the Suggestion with no way to remove them.

That expression is combined with `||`, not `??`, and the difference is the whole rule. `disabled` is
destructured with a default of `false`, so `disabled ?? (…)` never reached the past-day branch at all: every
past day rendered as an enabled, focusable button with the hover lift, dimmed only by the independent
opacity class. `||` is what makes a caller's explicit `disabled` and the past-day rule both count.

**The Summary counts Holidays inside the Planning Window only.** The store holds two years so the UI can
show the extra ones for context, so the Holidays metric card, the composition pie, the "specific to your
region" line and the custom-Holiday banner all read a list filtered on `isInPlanningWindow` — otherwise the
headline figure is roughly double what the Holidays table beside it lists. This is a *display* filter and
belongs here; the same narrowing applied to `generateMetrics` was tried and reverted, for the reason in
[`@domain/calendar/CLAUDE.md`](../../../../domain/calendar/CLAUDE.md).

**The Legend's stuck state is CSS, and the JavaScript that shadowed it was dead.** [`legend.module.css`](./legend.module.css)
declares `container-type: scroll-state` on `.sticky_container` and styles the collapsed form under
`@container pto-legend scroll-state(stuck: bottom)`. [`shared/donate/Donate.tsx`](../../shared/donate/Donate.tsx) also carried an effect that
found the Legend by a `legend-sticky` id, listened on `scroll` unthrottled, called `getBoundingClientRect()`
per frame and toggled `data-legend-stuck` on `<html>` — an attribute no stylesheet in the package ever read,
so it was not the `@supports` fallback it looked like. Both the effect and the id are gone. If a fallback for
browsers without `scroll-state()` is ever wanted, it belongs beside `Legend.tsx` **with a CSS rule that
consumes the attribute**, not in a cross-screen component reaching in by DOM id.

**`data-tutorial` attributes are load-bearing, and they come from `TUTORIAL_ANCHOR`.** `CALENDAR_LIST`,
`HOLIDAYS_LIST`, `PLANNER_DRAWER`, `ALTERNATIVES_MANAGER` and `PTO_STATUS` are this screen's driver.js
anchors; the const in [`../../tutorial/anchors.ts`](../../tutorial/anchors.ts) is the only place their
strings are written, so a rename is a compile error rather than a step that silently highlights nothing. `ManagementBar` additionally listens
for the two window events in `TUTORIAL_EVENT`, dispatched by [`hooks/useTutorial.tsx`](../../../hooks/useTutorial.tsx) — a deliberately
loose coupling so the tutorial does not import planner state, and invisible to a search for the
listener's caller.

**The expand event needs a matching collapse, and for a while it had none.** The tutorial expanded the
drawer at its `ALTERNATIVES_MANAGER` step and nothing ever brought it back down: the only reset was inside
`handleSelectionChange`, so the drawer stayed expanded until the user applied an Alternative. The tour end
now dispatches `COLLAPSE_DRAWER` from `onDestroyStarted`, which fires on the done button, the close button
and an outside click alike. Both events live in `TUTORIAL_EVENT` rather than as literals in two files,
because a listener and a dispatcher that disagree about a string fail silently in exactly this way.

**`DRAWER_SNAP.EXPANDED` is 0.85 and must stay below 1.** The drawer is `h-[100dvh] max-h-none`, which is
what makes a snap point mean "this fraction of the viewport is visible" — vaul translates a viewport-sized
element down by `innerHeight - snap * innerHeight`. At a snap of exactly 1 the translation is zero, so the
element covers the screen edge to edge; `dismissible={false}`, `overlay={false}` and no close button then
leave nothing to tap to get out of it, and vaul's own `[data-vaul-drawer] { touch-action: none }` kills
scrolling wherever it lands. Capping the top snap at 0.85 keeps 15dvh of page reachable above it, which is
also where the floating sidebar trigger sits. Do not raise it to 1 to "use the whole screen", and do not
delete `max-h-none` while the height is `100dvh` — the base `max-h-[85dvh]` in
[`Drawer.tsx`](../../core/animate/base/Drawer.tsx) would clamp the box while vaul kept translating it as
though it were still full height.

## Conventions

- `'use client'` at the top of anything with state, an effect, a store read or a recharts chart. Declare it
  even when every current importer is already a client module: inheriting the boundary compiles, but the
  build then breaks a long way from the cause the day a server component imports the file.
- Consume several store fields through one `useShallow` selector, not one `useState`-shaped read per field.
- Motion configuration lives at module scope (`STAT_CARD_MOTION_CONFIG`, `LABEL_VARIANTS`,
  `BADGE_VARIANTS` in `PlannerPanel.tsx`), so the object identity is stable across renders.
- `<Skeleton name='…' fixture={…} fallback={…}>` for loading states, never a hand-rolled shimmer. The
  bones `calendar-list`, `planner-panel` and `summary` are registered in [`modules/bones/registry.ts`](../../bones/registry.ts).
  Both props take the same fixture component and both are required: `fixture` is read only by the
  capture CLI, `fallback` is what renders when no bone resolves, so passing `fixture` alone shows an
  empty container. See [`../../CLAUDE.md`](../../CLAUDE.md).

## Screen boundaries

Anything two screens share belongs in `shared/`, never in the other screen's folder. Both directions
between this screen and the homepage used to be crossed and are not any more:

- [`SupportButton.tsx`](../../shared/SupportButton.tsx) — mounted by `calendar/usePlannerDayClick.tsx` inside the "this is a Premium feature" toast
  *and* by [`pages/homepage/sections/Pricing.tsx`](../homepage/sections/Pricing.tsx) — lives in `shared/`.
- [`FaqTabs.tsx`](../homepage/support/FaqTabs.tsx), `Troubleshooting.tsx` and their [`types.ts`](../homepage/support/types.ts) sat here while [`pages/homepage/sections/Faq.tsx`](../homepage/sections/Faq.tsx)
  was their only consumer; they now live under `pages/homepage/support/`.
- `getViewBoxFromSvg` moved out of `calendar/utils/helpers.ts` into [`shared/utils/helpers.ts`](../../shared/utils/helpers.ts), so
  [`shared/Icon.tsx`](../../shared/Icon.tsx) no longer reaches into this screen.

One import still points the other way, and it is a util rather than a component:
[`pages/homepage/sections/Hero.tsx`](../homepage/sections/Hero.tsx) reads `MODIFIERS_CLASS_NAMES` from this screen's `utils/`. Promote it to
`shared/` before a second caller appears. `Troubleshooting.tsx` was the other one, for `getTotalMonths`; that
function moved into `@domain/calendar/window` as `planningWindowMonths` and the component no longer needs it
at all, because `generateSuggestions` takes the window rather than its expansion.

## Testing

Fifteen test files. The components carrying them are the ones holding logic, and the rest are left
to the Playwright suite in `e2e/` — which on this screen asserts only that `/planner` answers 200, has a
title, and does not trip the error boundary. No e2e spec drives a calculation, so nothing outside these
files pins planner *behaviour*.

Three are recent, and each covers something no type could. [`utils/modifiers.test.ts`](./utils/modifiers.test.ts) drives the day
predicates directly: `isAlternative` at index 0, at n, and against a date the applied Suggestion already
holds, and `isSuggestion` with a Removed Day. Nothing had touched that module before — the only test file
mentioning `modifiers` was `calendar/utils/helpers.test.ts`, and every one of its modifiers was a synthetic
`() => true`. [`calendar/Calendar.test.tsx`](./calendar/Calendar.test.tsx) is the component's first test in 466 lines, and covers the two
decisions above plus what `dayStates` paints. [`PlannerPanel.test.tsx`](./PlannerPanel.test.tsx) covers the Alternative index
round-trip.

`calendar/utils/helpers.test.ts` is the one that pins the precedence chain documented under *Day
classification*, which is the only ordering on this screen that a reader is likely to get wrong from the
source: the object-key order is not the precedence order, `today` short-circuits, and `selected` is appended
after the loop it skipped. It calls `getDayClassNames` directly with synthetic modifier predicates and
asserts on the returned string, so it needs no render and no store.

**It asserts by substring, and two of the class strings are identical.** `rangeStart` and `rangeEnd` in
`MODIFIERS_CLASS_NAMES` are the same value character for character, so no substring test can tell which of
the two produced a match, and a test claiming to is passing on the other one. The distinction the tests do
draw is the real one — `inRange` is suppressed by `selected` and `rangeStart` is not, because they sit
behind separate guards.

`Summary.test.tsx` covers the two things on that screen a type cannot catch: which denominator the Efficiency
hint names, and whether the budget badges read grammatically at a budget of one. It mocks all four stores,
`next/dynamic` (so none of the five charts render) and `SlidingNumber`, then asserts on `container.textContent`.
Leave `core/animate/icons/Icon` real — mocking it drops `IconWrapper`, which every animated icon on the screen
renders through.

The chart tests are the pattern worth copying: mock `recharts` down to inert elements and mock
`@ui/modules/premium/PremiumFeature` to a pass-through, then assert on the data the component derived
rather than on the SVG. Component tests render inside `NextIntlClientProvider` with the real message
bundles, often two locales at once, which is what catches a key that only exists in [`en.json`](../../../i18n/messages/en.json).

**`YearTimelineChart` is the exception: it renders no recharts and is asserted on inline geometry.** Its
tests read `style.left` off the segment `div`s, and they read `left` rather than `width` for a reason —
happy-dom drops any declaration whose value it cannot parse, and the width is `max(8px, N%)`, so
`style.width` comes back as the empty string no matter what the component computed. Asserting a width here
passes vacuously. Positions are exact fractions of the strip, so assert them with `toBeCloseTo` against
`column / monthCount`.

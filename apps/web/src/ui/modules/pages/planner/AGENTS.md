# apps/web/src/ui/modules/pages/planner

## Purpose

The planner screen: the month calendars, the Holiday tables, the Alternative switcher, the PTO budget readout
and the analytics. The planner runs in the browser
([ADR 0001](../../../../../../../adr/0001-planner-runs-in-the-browser.md)), so this is where the loop of
*filter changes → recalculation → repaint* closes.

Nothing here computes a Suggestion. [`CalendarList.tsx`](./CalendarList.tsx) asks `useCalculationsWorker` to run
the engine off the main thread, and every other component reads the result back out of the holidays store.

## Sections

`src/app/[locale]/(app)/planner/page.tsx` `dynamic()`-imports these components and renders them in this order;
the layout adds [`SiteTitle.tsx`](./SiteTitle.tsx) and [`SiteSubtitle.tsx`](./SiteSubtitle.tsx) above them.
`SiteTitle` is a server component and the year in it is [`SiteTitleYear.tsx`](./SiteTitleYear.tsx), the client
island that reads `year` off the filters store and animates it through `SlidingNumber`, showing the year the server
rendered with (`serverYear`) until the stores are ready.

| Component | Role |
| --- | --- |
| [`HolidaysList.tsx`](./HolidaysList.tsx) | Tabs over [`HolidaysTable.tsx`](./holidays/HolidaysTable.tsx), one per Holiday Variant. The Custom tab is behind the Premium gate; the Regional tab is inert when the Region has no Holidays |
| [`ManagementBar.tsx`](./ManagementBar.tsx) | Sticky host for [`PlannerPanel.tsx`](./PlannerPanel.tsx): inline on desktop, inside a `vaul` drawer on mobile, with [`PlannerPanelFixture.tsx`](./PlannerPanelFixture.tsx) as its skeleton fixture and fallback |
| `CalendarList.tsx` | Owns the Holiday fetch and the worker trigger, and renders one `Calendar` per month of the Planning Window (`planningWindowMonths`, from `@domain/calendar/window`). The trigger sends `year` and `carryOverMonths`; the engine expands the window itself |
| [`Legend.tsx`](./Legend.tsx) | Explains the day colours. Exports `Legend` and `LegendItems`, which `ManagementBar` reuses inside the mobile drawer |
| [`Summary.tsx`](./Summary.tsx) | Metric cards and charts; the charts are `dynamic()`-imported from here rather than from the route |
| [`Roadmap.tsx`](./Roadmap.tsx) | Feature map over `RadialNav` and `FeatureList` from `core/animate/components/` |
| [`Contact.tsx`](./Contact.tsx) | The feedback prompt; opens [`shared/contact/ContactModal.tsx`](../../shared/contact/ContactModal.tsx) through [`shared/contact/LazyContactModal.tsx`](../../shared/contact/LazyContactModal.tsx), which the footer button and the error page share and which downloads the modal only once it has opened |

## Subdirectories

| Directory | Contents |
| --- | --- |
| `calendar/` | [`calendar/Calendar.tsx`](./calendar/Calendar.tsx): one month grid and its selection modes, and nothing that knows what a planner is; [`calendar/usePlannerDayClick.tsx`](./calendar/usePlannerDayClick.tsx): the planner's click policy; [`calendar/utils/helpers.ts`](./calendar/utils/helpers.ts): `MODIFIERS_CLASS_NAMES`, `getDayClassNames`, `getDayStateLabelKeys` and `isFromToObject`; [`calendar/utils/refusals.ts`](./calendar/utils/refusals.ts); [`calendar/CalendarListFixture.tsx`](./calendar/CalendarListFixture.tsx) |
| `holidays/` | `holidays/HolidaysTable.tsx` plus [`holidays/components/`](./holidays/components): [`HolidayRow.tsx`](./holidays/components/HolidayRow.tsx), [`HolidayTableHeader.tsx`](./holidays/components/HolidayTableHeader.tsx), [`HolidayFormModal.tsx`](./holidays/components/HolidayFormModal.tsx) and the two callers that configure it, [`DeleteHolidayModal.tsx`](./holidays/components/DeleteHolidayModal.tsx), and the Zod factory in [`holidays/components/schema.ts`](./holidays/components/schema.ts) |
| `summary/` | The charts, [`summary/MetricCard.tsx`](./summary/MetricCard.tsx), [`summary/SummaryFixture.tsx`](./summary/SummaryFixture.tsx) and [`summary/const.ts`](./summary/const.ts) |
| `utils/` | [`utils/helpers.ts`](./utils/helpers.ts): the month grid (`getCalendarDays`), the range counters (`calculateWorkdays`, `calculateWeekends`, `calculateHolidaysInRange`) and the Planning Window's month labels (`getWindowMonthLabels`); [`utils/modifiers.ts`](./utils/modifiers.ts): the day predicates |

**Adding and editing a Holiday are one form, `HolidayFormModal`.** `AddHolidayModal` and `EditHolidayModal` each
supply an icon, a copy namespace and an `onCommit` bound to their own store action. `onCommit` answers the
store's `HolidayOutcome`, or `null`, which is how Edit says nothing changed without the form knowing what an
edit is. The field chrome reads `modals.addHoliday` in both modes.

**The planner's click policy is `calendar/usePlannerDayClick.tsx`, not the calendar.** `Calendar` has three
callers: `CalendarList` spends days, `HolidayFormModal` picks a date and `WorkdayCounterCalendarModal` picks a
range. In `NONE` mode it calls `onDayToggle?.(date)` and ignores the answer; the hook wraps the `toggleDay`
`CalendarList` hands it, gates on `premiumKey` and toasts the refusal that comes back.

`calendar/utils/refusals.ts` holds both refusal mappings; the rules are in the store. `DAY_REFUSAL_COPY` maps
every `DayRefusal` to its toast keys, or to `null` for no toast, and is declared
`satisfies Record<DayRefusal, …>`. `describeHolidayRefusal` does the same for the Holiday modals as a function,
because its cases interpolate; it answers `null` for the one refusal with no copy of its own, which both modals
render as their generic error. A refusal added without an entry is a compile error in either.

## Day classification

`utils/modifiers.ts` exports curried predicates (`isHoliday`, `isCustom`, `isSuggestion`, `isManual`,
`isAlternative`, `isPast`, `isToday`, and the selection and range family). `Calendar` builds them into one
`modifiers` object and hands it to `getDayClassNames`, which looks each name up in `MODIFIERS_CLASS_NAMES`.
Adding a day state means an edit in each place: the predicate, the entry in `modifiers`, the class-name entry
under the same key and, for a state a reader should hear, a row in `DAY_STATE_LABELS`, which appends it to the
day's accessible name.

**`Calendar` builds only the states it can answer for itself, and the caller supplies the rest.** Weekend,
Holiday, Custom, today, past and the selection and range family come from `holidays`, `allowPastDays`, its own
`today` and its own selection. The plan's states (`suggested`, `alternative`, `manual`) arrive through
the `dayStates` prop: `CalendarList.tsx` builds all three from the holidays store,
[`holidays/components/HolidayFormModal.tsx`](./holidays/components/HolidayFormModal.tsx) supplies `suggested`
alone, so its date picker still shows which dates the plan has spent, and
[`sidebar/components/WorkdayCounterCalendarModal.tsx`](../../sidebar/components/WorkdayCounterCalendarModal.tsx)
supplies none. A caller that omits `dayStates` paints no plan state.

Precedence inside `getDayClassNames` is not the object order:

1. The loop is skipped when the day is selected (single or multiple mode) or disabled; `selected` is appended
   at the end instead, so it wins outright.
2. `today` short-circuits the loop: when it matches, no other modifier class is applied.
3. Otherwise every matching modifier contributes, in object-key order, except `inRange`, `rangeStart` and
   `rangeEnd`, which are appended afterwards so a range boundary paints over a Holiday.
4. A disabled day (the calendar's `disabled`, or a past day the plan does not hold) then adds `!opacity-20` /
   `!opacity-40`, which beats everything above.

`disabled`, the bound `isPast({ allowPastDays, today })`, carries no class of its own: the render reads it for
each cell's `disabled` attribute and `getDayClassNames` reads it for the past-day fade, so the rule has one
author. A class entry under that key would paint every past day.
[`calendar/utils/helpers.test.ts`](./calendar/utils/helpers.test.ts) drives the fade through the real `isPast`.

`MODIFIERS_CLASS_NAMES` is `as const satisfies Record<string, string>`, so its keys stay literal and a mistyped
lookup is a compile error; the `Legend` swatches read the same record.

`isAlternative` returns `false` for any date already in `currentSelection`, a required parameter: an
Alternative is painted only where it differs from the applied Suggestion.

## Invariants

**`CalendarList` also clears the plan.** Its trigger is gated on
`ptoDays > 0 && holidays.length > 0 && months.length > 0` (`canCalculate`), and when that gate closes while a
Suggestion stands, the effect calls `clearCalculation()`. `fetchHolidays` writes only `holidays` and
`holidaysKey`, so without it a Country whose Holidays fail to load, or a Region with none, keeps the previous
Country's plan painted. The Suggestion condition keeps the cold load, where the gate is also closed, from
clearing a plan that was never there and marking the store as calculated. The pipeline itself does not need
the `holidays.length > 0` term (see [`@application/stores/AGENTS.md`](../../../../application/stores/AGENTS.md));
removing it changes when this clear fires as well as when a run starts.

**Only `CalendarList.tsx` triggers a calculation, and only on the Holidays of the filters on screen.** Its
effect depends on year, Carry-over Months, PTO budget, Strategy, Preferred Months, the past-days flag, locale
and `planRevision`, and on `triggerCalculation`, whose identity changes with the `holidays` and
`maxAlternatives` that `useCalculationsWorker` selects. It fires only while `holidaysKey` in the holidays store
names the Country, Region, year, Carry-over Months and locale the filters do (`holidaysKeyOf`); without that gate
a year change plans once on the previous year's Holidays, and a reload on the persisted ones. `holidaysKey` is
not persisted, so a reload waits for its first fetch. `planRevision` is the signal
`setCurrentAlternativeSelection` and `resetManualSelection` bump so that applying or resetting a plan re-plans
it; see [`@application/stores/AGENTS.md`](../../../../application/stores/AGENTS.md).
[`Troubleshooting.tsx`](../homepage/support/Troubleshooting.tsx) is the one other caller: it runs the holidays
store's `generateSuggestions` on the main thread. Both paths reach `runPlanningPipeline`, which clears the
calculation caches on entry ([ADR 0006](../../../../../../../adr/0006-caller-owned-calculation-caches.md)).

**`CalendarList` prunes Manual and Removed Days when the Planning Window moves.** `pruneDaysOutsideWindow` runs
on every change to `year` or `carryOverMonths`, before the calculation effect. `measureBudget` counts every
Manual Day, inside the window or not, so without it a Manual Day left in a year the user navigated away from
keeps spending budget with no visible cause, until a reload runs the store's other caller,
`onRehydrateStorage`.

**Store-backed numbers wait for rehydration.** `CalendarList`, `ManagementBar`, `Summary` and `HolidaysList` gate
on `useStoresReady()` and show a `<Skeleton>`, or nothing, until every persisted store reports hydrated;
rendering store values on the first pass produces a hydration mismatch. The hook reports not ready on its first
render, always, and raises the status in an effect: `obfuscatedStorage` is synchronous, so `hasHydrated()` is
already `true` on the first client render, while the server rendered these `dynamic()` sections (no
`ssr: false`) with empty stores. Seeding the hook from `hasHydrated()` would reproduce the mismatch.
`SiteTitleYear` and the sidebar's `Years` gate `year` for another reason: it is not persisted, but it defaults to
the clock's year at module load, which the prerendered HTML fixed at build time, so from New Year until the next
deploy the client's first pass would disagree with that HTML. Both show the year the server rendered with until
the stores are ready.

**`PremiumFeature` from `@ui/modules/premium` wraps the gated parts** (the Custom Holiday tab, the row
checkboxes, the advanced charts) and renders its children as soon as `premiumKey` is set;
`calendar/usePlannerDayClick.tsx` reads `premiumKey` before a day click reaches the store. Access is derived
from the payment record ([ADR 0008](../../../../../../../adr/0008-premium-derived-from-payment.md)).

## Gotchas

**A Quarter here is a Quarter of the Planning Window, so `Q5` is not a bug.** `QuarterDistributionChart` and
`BlocksPerQuarterChart` label their bars `Q${index + 1}` over the array the engine sizes with
`windowQuarterCount`, `ceil((12 + carryOverMonths) / 3)`. The default Carry-over Month count is 1, so the
default window already holds five. [`GLOSSARY.md`](../../../../../../../GLOSSARY.md) defines Quarter.
`MonthlyDistributionChart` sizes its axis the same way, from `monthlyDist.length`, and takes no
`carryOverMonths`: the filters can move on while a plan from the older window is still on screen, and a chart
that read them would pad that plan with months it never measured or name its last months `Month 13`.

**`CalendarList`'s `toggleDay` answers `DayRefusal.PLAN_IN_FLIGHT` while a calculation runs**, before the store
is reached. The grid's `pointer-events-none` during `isCalculating` stops the mouse and not Enter or Space on a
focused day. The race the refusal closes is silent:

- Removing a Suggested Day mid-run appends to `removedSuggestedDays`, which `setCalculationResult` clears when
  the worker answers: the removal is discarded and the day comes back.
- Adding a Manual Day mid-run appends to `manualDays`, which `setCalculationResult` does not clear,
  while the request in flight was posted with the older list and an `autoSuggestCount` computed from it: the
  arriving plan spends the full budget beside a Manual Day it never saw, and the total can exceed `ptoDays`. See
  the budget-cap notes in [`../../../AGENTS.md`](../../../AGENTS.md).

The `Calendar`'s own `disabled` prop is not the guard: it reaches every day button, and a focused button that
becomes disabled drops focus to `<body>` on every recalculation. `PLAN_IN_FLIGHT` maps to `null` in
`calendar/utils/refusals.ts`, like `NO_PLAN`, because the live region already says a run is in progress.

**Each fact has one live region.** `CalendarList.tsx` carries `aria-busy` on the grid and an `sr-only`
`role="status"` that says `a11y.calculating` during a run and `a11y.planUpdated` after one; `ManagementBar.tsx`
announces `a11y.noPlan` when `isSettledEmpty`; `Status` in `PlannerPanel.tsx` holds the Remaining Budget's
`role="status"`. [`sidebar/components/PtoDays.tsx`](../../sidebar/components/PtoDays.tsx) renders the same number
beside it on desktop and is deliberately not live: each number is `sr-only` text after its visible label, read
where the reader reaches it, so a change is announced once.

**The mobile drawer is a `region`, not a `dialog`.** `ManagementBar.tsx` mounts vaul with
`modal={false} dismissible={false} open={!openMobile}`: always open, never dismissed, no close button. It
passes `role="region"` through to `DrawerPrimitive.Content`, which works because Radix writes its own
`role="dialog"` before spreading `contentProps`. No `aria-label` goes with it: Radix also sets `aria-labelledby`
ahead of the spread, pointing at the `DrawerTitle` this file renders, and `aria-labelledby` wins.

**`Legend.tsx` is a disclosure.** A `<button aria-expanded aria-controls>` whose text names the state toggles
`.section.expanded`; the button stays `display: none`, and so out of the tab order, until the stuck container
query promotes it. The collapsed content stays readable (`grid-template-rows: 0fr` clips it rather than hiding
it), because only the container query knows whether the card is stuck.

**The Legend's stuck state is CSS alone.** [`legend.module.css`](./legend.module.css) declares
`container-type: scroll-state` on `.sticky_container` and styles the compact form under
`@container pto-legend scroll-state(stuck: bottom)`. A fallback for browsers without `scroll-state()` belongs
beside `Legend.tsx`, with a CSS rule that consumes it, not in another component reaching in by DOM id.

**The sticky container never changes height, which is what stops the Legend flickering at the edge.** The
compact stuck form is shorter than the open card, and a `bottom: 0` sticky box unsticks once its natural bottom
rises into view, so a card that shrank on sticking would toggle every frame inside a band as tall as the
difference. `Legend.tsx` renders an inert, `aria-hidden`, invisible copy of the open card (`.ghost`, no toggle)
in the same grid cell as the real one (`.live`), so the container keeps the open height; only `.live` answers
the stuck query, and the container passes pointer events through everywhere but the card. The copy is not dead
markup.

**`Calendar` is not a grid.** It declares no `grid`, `row`, `gridcell` or `columnheader` role and has no roving
focus: every day is a `<button>` in the tab order, named with its full date, its Holiday and its plan state.
[`calendar/Calendar.test.tsx`](./calendar/Calendar.test.tsx) fails on a bare grid role.

**The month header is one block.** The title and the month's Holiday count render once; `showNavigation` decides
only whether the previous, today and next controls render. The title is one date, `formatDateParts` over
`LLLL yyyy`, and only its `year` part is styled, so a locale that joins the month and the year with a word writes
it ("junio de 2026", "juny del 2026") and one that orders them the other way writes the year first; two
`formatDate` calls with a space between them assume an order and a joining word that only English has.

**`today` is state initialised to `null`, not `new Date()`.** `Calendar` sets it in an effect on mount, so the
first paint has no today marker and no past-day fade, and server and client agree. Every predicate taking
`today` handles `null`.

**The Remaining Budget readout freezes during a recalculation, and `@ui/hooks/usePlanReadout` owns the freeze.**
It holds `lastSettledRemaining` in state and updates it during render only while `isCalculating` is false, so
the readout does not drop to zero for every worker round trip. `Status` in `PlannerPanel.tsx` and
[`sidebar/components/PtoDays.tsx`](../../sidebar/components/PtoDays.tsx) both read it, and the number is
`measureBudget`'s, the rule `toggleDaySelection` consults before spending a day.

**"No plan" is not "still loading", and `ManagementBar` keeps them apart.** `isReady` needs a Suggestion and an
applied selection with days in them. `isSettledEmpty` is stores hydrated, a calculation completed at least once
(`hasCalculated`, set by `setCalculationResult` and `clearCalculation`, not persisted), nothing in flight, and
still not ready; the panel then renders nothing rather than a skeleton that never resolves. Every term is
needed: without `hasCalculated` the cold load qualifies, because `isCalculating` is a worker-only flag the
Holiday fetch never raises.

**The mobile drawer header reads `previewAlternativeIndex`, not `currentSelectionIndex`.** The figures beside it
come from `allSuggestions[previewAlternativeIndex]`, and the label names the index the figures are read from.

**`PlannerPanel` is remounted by `key={previewAlternativeIndex}`**, so the entry animations replay when the user
pages through Alternatives. Any state inside it is discarded on every Alternative change, which is why
`Alternatives` reads the store's index through `selectedIndex` and keeps none of its own. `onPreviewChange`
takes an index and `ManagementBar` hands the store `{ index }` (`AlternativePreviewParams`);
`onSelectionChange` passes the Suggestion too, because `setCurrentAlternativeSelection` applies it.

**`Contact.tsx` reads the `roadmap` namespace, not `contact`**, which belongs to the modal in `shared/contact/`.
It imports [`contact.css`](./contact.css), global CSS rather than a module, so `.dashed-card` is visible to the
whole app. It opens the modal on arrival when the address carries `#contact`, the `id` it renders; no link in
the repository points there.

**The "alternatives that add more days" banner compares only with the Alternatives the chosen Strategy found.**
`canImprove` reads `maxAlternative` over the Alternatives whose `strategy` equals the filters store's; the other
Strategies' plans carry their own value there (see *Invariants and traps* in the
[engine guide](../../../../domain/calendar/AGENTS.md)). The engine never hands out an Alternative ahead of the
Suggestion, so the banner speaks up only when the plan on screen is behind one: after a hand edit, or when the
applied Alternative is itself a weaker one. The header badge and the summary sentence name the Strategy of the
plan on screen (its own `strategy`, narrowed with `isStrategy`). The banner's button links to `#calendar`,
the `id` `CalendarList.tsx` gives its grid.

**`Summary.tsx` measures against different denominators.** `ptoDays` here is the budget, read from the filters
store; the engine's Metrics are computed against the days the plan placed (`days.length` in
[`generateMetrics.ts`](../../../../domain/calendar/metrics/generateMetrics.ts)). So:

- `gain` comes from `measureGain` in `@domain/calendar/utils/budget`, budget-based;
- `metrics.averageEfficiency` is placed-based;
- the Effective Days badge shows `overBudget`, budget-based, while `yearSummary.totalBonusDays` shows
  `metrics.bonusDays`, placed-based.

They agree only when the plan spends the whole budget, and a Removed Day or a Bridge that no longer fits leaves
budget standing. So Gain is not Efficiency minus one, and the badge is not a Bonus Day count as
[`GLOSSARY.md`](../../../../../../../GLOSSARY.md) defines it, which is why its label says "over budget". The screen
names each figure's baseline instead of aligning them: the Effective Days and Gain badges interpolate `ptoDays`,
and the Efficiency card's `hint` names the days placed.

**The Efficiency hint counts days the way `generateMetrics` does.** `toggleDaySelection` never rewrites
`currentSelection.days`, so the stored list is the plan as the engine placed it. `Summary` reads `placedDays`
from `usePlacedPlan`, the half of `usePlanReadout` with no `isCalculating` subscription, which applies
`resolveSelectedDays` with the lists the store holds;
[`sidebar/components/CalendarExport.tsx`](../../sidebar/components/CalendarExport.tsx) reads the same field.
Anything else on this screen that wants the days spent takes them from the hook.

**The budget badges carry an ICU plural in the five bundles that need one.** `MIN_PTO_DAYS` is 1, so
`metrics.overBudget` and `metrics.perPtoDay` are reachable at a budget of one; `es`, `ca`, `it`, `de` and `fr`
put a noun after the number and select it with `{ptoDays, plural, …}`, while `en` reads "your 1-day budget".
`overBudget` also carries the days over budget, `{increment, plural, =0 {0} other {+#}}`, and `Summary` hands it
`Math.max(0, …)`, because a plan that returns less than its budget reads nought rather than a negative number.

**`MetricCard`'s props are a union on `size`.** `hint` exists only on the compact card and `badge` only on the
full-size one, so either passed to the other layout is a compile error. The card rounds to whole numbers unless
given `decimalPlaces` (`SlidingNumber` runs `toFixed`), so a fractional metric passes `decimalPlaces={1}`, as
Efficiency and `workedDaysPerMonth` do. A unit that agrees with the number goes through `renderValue`, which
receives the counter and returns the message around it: Longest Vacation passes `yearSummary.daysCount`, whose
`<n>#</n>` places the counter. The value row is a flex row, where the message's space collapses, so `renderValue`
adds a gap; the Max Work Streak beside it carries the same gap. The Gain passes `metrics.gainValue` the same way,
inside a `flex` span of its own, because a `%` sits tight against its number in English and Italian and a gap
would pull them apart. The card has no `symbol` prop: a glyph is part of the message `renderValue` places.

**A sign, a unit or a bracket around a counter is part of the message, never a sibling of the counter.**
`alternativesManager.efficiencyValue`, `comparisonPercent` and `bonusDaysBadge`, `summary.metrics.gainValue` and
`summary.yearSummary.bonusDaysCount` each hold the glyph and a `<n>` tag where the counter goes, so a bundle puts
the `x`, the `%` (after a no-break space in Spanish, Catalan, German and French) or the `+` where its language
writes them. The Efficiency gap beside the card's value is not a counter: it goes through `format.number` with
`signDisplay: "exceptZero"`, which writes the plus and the minus its locale uses and no sign at all for a gap that
rounds to nought. The budget's two percentages are `{pct, number, percent}` inside `ptoStatus.usedDays` and
`remainingDays`, handed the fraction. The drawer header of `ManagementBar` shows the same `efficiencyValue` as
plain text, so it renders it with `t.rich` and `n: (chunks) => chunks`. The assigned note draws a `Check` icon, not
a `✓` typed in front of the sentence. `PlannerPanel.test.tsx`, `Summary.test.tsx` and `ManagementBar.test.tsx`
render each of these in all six bundles, and each has a case that swaps the glyph in the bundle and expects the
page to follow.

**`usePlannerDayClick` checks Premium, hands the day to the store and renders whatever refusal comes back
through `DAY_REFUSAL_COPY`.** A new refusal is a new reason in the stores'
[`types.ts`](../../../../application/stores/types.ts) plus an entry in that map.

**A Holiday's status badge says whether it is a Weekday Holiday or falls on a weekend.** `HolidayRow` draws it, and
the table's footer counts each kind (`holidaysTable.weekendCount` and `weekdayHolidayCount`). Neither calls a
Holiday a Workday, the term [`GLOSSARY.md`](../../../../../../../GLOSSARY.md) keeps for a date that is no Holiday.

**`getHolidayId` in `holidays/HolidaysTable.tsx` returns `` `${holiday.id}::${holiday.name}` ``.** The toolbar count and the modals read
`selectedHolidaysList`, resolved against `variantHolidays` rather than the visible rows, so a selection a search
hides still counts and one left over from a Holiday that no longer exists drops out. The select-all checkbox is
the exception: it reads and writes the visible rows, which is what "select all" means with a filter on.

**The three Holiday modals are `dynamic()` and mount only once opened** (`useHasOpened`), then stay mounted so
their close animates; Edit also unmounts when the selection stops being one Holiday.

**The sortable column headers are buttons inside the `th`, and the `th` carries `aria-sort`.** In
`holidays/components/HolidayTableHeader.tsx` the cell's padding is on the button (`p-0` on the `TableHead`,
`h-11 px-3` on the button), so the whole cell stays clickable.

**There is more than one unrelated `COLOR_SCHEMES`.** `summary/const.ts` exports an array of brand CSS variables
the recharts charts index into; `summary/MetricCard.tsx` declares its own record keyed by colour name. Neither
is derived from the other.

**[`YearTimelineChart.tsx`](./summary/YearTimelineChart.tsx) is not a recharts chart.** It is positioned `div`s,
with `Temporal.PlainYearMonth` for month lengths ([ADR 0005](../../../../../../../adr/0005-temporal-polyfill.md));
the other charts use recharts and are the reason `Summary.tsx` loads them through `dynamic()`. It spans the
Planning Window: it takes `carryOverMonths` and positions through the engine's `windowMonthCount` and
`windowMonthIndex` rather than restating them, and `Summary` hands it `holidaysInWindow`. Its month labels repeat
with a Carry-over Month, so each cell is keyed `${year}-${month}` from the date it represents.

**A past day stays clickable when it is already a Manual Day or a Suggested Day.** `calendar/Calendar.tsx`
computes each cell's `isDisabled` as the past-day modifier minus those states, so a day the plan holds can still
be edited once its date has gone by. The expression combines with `||`, not `??`: `disabled` is destructured
with a default of `false`, so `disabled ?? (…)` would never reach the past-day branch.

**The Summary paints only the plan made for the filters on screen.** It compares the holidays store's
`planKey` with `holidaysKeyOf` over the Country, Region, year, Carry-over Months and locale, and renders nothing
until they match; the Skeleton keeps its place. A change to the budget or the Strategy keeps the key, so the
charts do not blank while those recalculate. The Country and Region badges read the location store, which
`StoresInitializer` fills from the layout, not the sidebar: on a phone the sidebar mounts its controls only while
the drawer is open.

**The Summary counts Holidays inside the Planning Window only.** The store holds two years, so the Holidays card,
the composition pie, the "specific to your region" line, the Custom Holiday banner and the timeline read
`holidaysInPlanningWindow(holidays)`; otherwise the headline figure is roughly double what the Holidays table
lists. This is a display filter and belongs here: `generateMetrics` must not take the same narrowing, for the
reason in [`@domain/calendar/AGENTS.md`](../../../../domain/calendar/AGENTS.md).

**`data-tutorial` attributes are load-bearing, and they come from `TUTORIAL_ANCHOR`.** `CALENDAR_LIST`,
`HOLIDAYS_LIST`, `PLANNER_DRAWER`, `ALTERNATIVES_MANAGER` and `PTO_STATUS` are this screen's driver.js anchors,
written once in [`../../tutorial/anchors.ts`](../../tutorial/anchors.ts). `ManagementBar` also listens for the
window events in `TUTORIAL_EVENT`, which [`hooks/useTutorial.tsx`](../../../hooks/useTutorial.tsx) dispatches on
mobile: `EXPAND_DRAWER` when the `ALTERNATIVES_MANAGER` step is highlighted, `COLLAPSE_DRAWER` from
`onDestroyStarted`, which fires on the done button, the close button and an outside click alike. The coupling is
loose on purpose, so the tutorial imports no planner state, and a search for the listener's caller finds
nothing. Applying an Alternative collapses the drawer too.

**`DRAWER_SNAP.EXPANDED` is 0.85 and must stay below 1.** The drawer is `h-[100dvh] max-h-none`, so a snap point
is the fraction of the viewport showing: vaul translates the element down by `innerHeight - snap * innerHeight`.
At exactly 1 it covers the screen, and with `dismissible={false}`, `overlay={false}` and no close button nothing
is left to tap, while vaul's `[data-vaul-drawer] { touch-action: none }` kills scrolling. 0.85 keeps 15dvh of
page above it, where the floating sidebar trigger sits. Keep `max-h-none` while the height is `100dvh`: the base
`max-h-[85dvh]` in [`Drawer.tsx`](../../core/animate/base/Drawer.tsx) would clamp the box while vaul kept
translating it as though it were full height. `DRAWER_SNAP.COLLAPSED` (0.15) is written out again as the donate
button's offset the planner layout passes to [`shared/donate/Donate.tsx`](../../shared/donate/Donate.tsx), and the
layout's test fails when the two drift apart.

## Screen boundaries

The bones this screen requests (`calendar-list`, `planner-panel` and `summary`) are registered in
[`modules/bones/registry.ts`](../../bones/registry.ts); see [`../../AGENTS.md`](../../AGENTS.md).
[`SupportButton.tsx`](../../shared/SupportButton.tsx), mounted by `calendar/usePlannerDayClick.tsx` inside the
Premium toast and by [`pages/homepage/sections/Pricing.tsx`](../homepage/sections/Pricing.tsx), lives in `shared/`.

Two sets of imports reach into this folder from outside it:

- [`pages/homepage/sections/Hero.tsx`](../homepage/sections/Hero.tsx) reads `MODIFIERS_CLASS_NAMES` from
  `calendar/utils/helpers.ts`, the one import from another screen.
- The sidebar belongs to this screen: [`sidebar/components/WorkdayCounter.tsx`](../../sidebar/components/WorkdayCounter.tsx)
  imports `FromTo`, `isFromToObject` and the range counters in `utils/helpers.ts`, and
  `WorkdayCounterCalendarModal.tsx` renders `Calendar` in range mode. A change to those signatures is a change to
  the sidebar.

## Testing

`HolidayRow` and `MetricCard` have no test of their own; the table and Summary tests exercise them. The
Playwright suite in `e2e/` asserts only that `/planner` answers 200 with and without a locale prefix, has a
title, carries the requested `lang` and links back to the homepage, and the quick start's spec that it arrives
there, so nothing outside these files pins planner behaviour.

- `calendar/utils/helpers.test.ts` pins the precedence chain under *Day classification*, calling
  `getDayClassNames` with synthetic modifiers. It asserts by substring, and `rangeStart` and `rangeEnd` in
  `MODIFIERS_CLASS_NAMES` are the same string, so no substring test can tell which of them produced a match; the
  distinction it draws is `inRange` suppressed by `selected` while `rangeStart` is not.
- `Summary.test.tsx` mocks the stores, `next/dynamic` (so no chart renders) and `SlidingNumber`, and asserts on
  `container.textContent`. Leave `core/animate/icons/Icon` real: mocking it drops `IconWrapper`, which every
  animated icon on the screen renders through.
- The chart tests mock `recharts` down to inert elements and `@ui/modules/premium/PremiumFeature` to a
  pass-through, then assert on the data the component derived rather than on the SVG. The
  `HolidaysDistributionChart`, `BlocksPerQuarterChart` and `SiteTitle` suites render their one-message sentences in all six bundles, so a broken message fails there.
- `HolidaysTable.test.tsx` reads the selection off the delete modal's stand-in, which mounts only once the delete
  button has opened it.
- `YearTimelineChart` is asserted on inline geometry. Read `style.left`, not `style.width`: happy-dom drops a
  declaration it cannot parse, and the width is `max(8px, N%)`, so `style.width` comes back empty whatever the
  component computed. Positions are exact fractions of the strip; assert them with `toBeCloseTo` against
  `column / monthCount`.

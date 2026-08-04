# src/ui/modules/pages/planner

## Purpose

The planner screen: twelve-plus month calendars, the Holiday tables, the Alternative switcher, the PTO
budget readout and the analytics. This is where the product's whole surface lives, and — because the
planner runs entirely in the browser ([ADR 0001](../../../../../docs/adr/0001-planner-runs-in-the-browser.md))
— where the loop of *filter changes → recalculation → repaint* actually closes.

Nothing here computes a Suggestion. `CalendarList.tsx` asks `useCalculationsWorker` to run the engine
off the main thread and every other component reads the result back out of the holidays store.

## Sections

`src/app/[locale]/(app)/planner/page.tsx` `dynamic()`-imports seven components and renders them in
this order; the layout adds `SiteTitle.tsx` and `SiteSubtitle.tsx` above them.

| Component | Role |
| --- | --- |
| `HolidaysList.tsx` | Tabs over `HolidaysTable.tsx`, one per Holiday Variant. The Custom tab is behind the Premium gate; the Regional tab is inert when the Region has no Holidays |
| `ManagementBar.tsx` | Sticky host for `PlannerPanel.tsx`. On desktop it renders it inline; on mobile it renders it inside a `vaul` drawer |
| `CalendarList.tsx` | Owns the Planning Window (`getTotalMonths`), the Holiday fetch and the worker trigger. Renders one `Calendar` per month |
| `Legend.tsx` | Explains the day colours. Exports `Legend` *and* `LegendItems`, which `ManagementBar` reuses inside the mobile drawer |
| `Summary.tsx` | Metric cards plus five charts, all five `dynamic()`-imported from here rather than from the route |
| `Roadmap.tsx` | Feature map over `RadialNav` and `FeatureList` from `core/animate/components/` |
| `Contact.tsx` | The feedback prompt; opens `shared/contact/ContactModal.tsx` |

## Subdirectories

| Directory | Contents |
| --- | --- |
| `calendar/` | `calendar/Calendar.tsx` — one month grid, ~540 lines, four selection modes; `calendar/utils/helpers.ts` — `MODIFIERS_CLASS_NAMES` and `getDayClassNames`; `calendar/CalendarListFixture.tsx` |
| `holidays/` | `holidays/HolidaysTable.tsx` plus `holidays/components/` — `HolidayRow.tsx`, `HolidayTableHeader.tsx`, the three modals, and the Zod factory in `holidays/components/schema.ts` |
| `summary/` | The five charts, `summary/MetricCard.tsx`, `summary/SummaryFixture.tsx` and `summary/const.ts` |
| `utils/` | `utils/helpers.ts` — Planning Window and calendar-grid construction, workday/weekend counting; `utils/modifiers.ts` — the day predicates |

## Day classification

`utils/modifiers.ts` exports curried predicates (`isHoliday`, `isSuggestion`, `isManuallySelected`,
`isAlternative`, `isCustom`, `isNationalOrRegionalHoliday`, `isPast`, `isToday`, and the range family). `Calendar`
builds them into one `modifiers` object and hands it to `getDayClassNames`, which looks each name up
in `MODIFIERS_CLASS_NAMES`. Adding a day state therefore means three edits: the predicate, the entry in
`modifiers`, and the class-name entry under the same key.

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

`isAlternative` deliberately returns `false` for any date already in `currentSelection`: an Alternative
is only ever painted where it *differs* from the applied Suggestion.

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
[`@application/stores/CLAUDE.md`](../../../../application/stores/CLAUDE.md). `Troubleshooting.tsx`, which now
lives under `pages/homepage/support/`, is the one other caller and it goes the other way —
`useHolidaysStore().generateSuggestions`, on the main thread. Those are the two *UI* entry points; the two
callers [ADR 0006](../../../../../docs/adr/0006-caller-owned-calculation-caches.md) counts are the ones that
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
[ADR 0008](../../../../../docs/adr/0008-premium-derived-from-payment.md) — so there is no boolean to
thread through props and no point caching one.

## Gotchas

**`today` is state initialised to `null`, not `new Date()`.** `Calendar` sets it in an effect on
mount. The server has no "today" that will still be true on the client, so the first paint has no
today marker and no past-day dimming on purpose. Every predicate taking `today` handles `null`.

**The remaining-days counter freezes during a recalculation.** `Status` in `PlannerPanel.tsx` keeps a
`lastSettledRemaining` ref updated by an effect *with no dependency array* — it runs every render and
snapshots the value only while `isCalculating` is false. That looks like a mistake and is not: without
it the budget readout drops to zero for the length of every worker round-trip.

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

**`Contact.tsx` reads the `roadmap` namespace, not `contact`.** The `contact` namespace belongs to the
modal in `shared/contact/`. It also imports `contact.css`, which is global CSS, not a module — the
`.dashed-card` class it defines is visible to the whole app.

**`Summary.tsx` measures against two different denominators, and three of its numbers depend on which.**
`ptoDays` here is the *budget*, read from the filters store; the engine's `Metrics` are computed against the
days the plan actually *placed* (`days.length` in `generateMetrics.ts`). So:

- `gain` is `(totalEffectiveDays - ptoDays) / ptoDays * 100` — budget-based.
- `metrics.averageEfficiency` is `totalEffectiveDays / days.length` — placed-based.
- the badge on the Effective Days card shows `increment`, budget-based, while `yearSummary.totalBonusDays`
  further down shows `metrics.bonusDays`, placed-based.

The two denominators are equal only when the plan spends the whole budget, and it deliberately does not
always — a Removed Day, or a Bridge that no longer fits, leaves budget standing (see
[`@domain/calendar/CLAUDE.md`](../../../../domain/calendar/CLAUDE.md)). Gain is therefore **not** Efficiency
minus one, and the badge is **not** a Bonus Day count as [`CONTEXT.md`](../../../../../CONTEXT.md) defines it
— which is why its label says "over budget" and never the word bonus. Collapsing any of these into one
another ships a number that is silently wrong by however much budget went unspent. Which baseline the screen
*should* use is an open product question, recorded in `docs/plans/sweep-findings.md`; until it is answered,
do not quietly align them.

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

**`YearTimelineChart.tsx` is not a recharts chart.** It is hand-built positioned `div`s using
`Temporal.PlainYearMonth` for month lengths ([ADR 0005](../../../../../docs/adr/0005-temporal-polyfill.md)).
The other four charts use recharts and are the reason `Summary.tsx` loads all five through `dynamic()`.

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
region" line and the custom-Holiday banner all read a list filtered on `isInSelectedRange` — otherwise the
headline figure is roughly double what the Holidays table beside it lists. This is a *display* filter and
belongs here; the same narrowing applied to `generateMetrics` was tried and reverted, for the reason in
[`@domain/calendar/CLAUDE.md`](../../../../domain/calendar/CLAUDE.md).

**`data-tutorial` attributes are load-bearing.** `calendar-list`, `holidays-list`, `planner-drawer`,
`alternatives-manager` and `pto-status` are the driver.js anchors. `ManagementBar` additionally listens
for a `tutorial:expand-drawer` window event dispatched by `hooks/useTutorial.tsx` — a deliberately
loose coupling so the tutorial does not import planner state, and invisible to a search for the
listener's caller.

## Conventions

- `'use client'` at the top of anything with state, an effect, a store read or a recharts chart. Declare it
  even when every current importer is already a client module: inheriting the boundary compiles, but the
  build then breaks a long way from the cause the day a server component imports the file.
- Consume several store fields through one `useShallow` selector, not one `useState`-shaped read per field.
- Motion configuration lives at module scope (`STAT_CARD_MOTION_CONFIG`, `LABEL_VARIANTS`,
  `BADGE_VARIANTS` in `PlannerPanel.tsx`), so the object identity is stable across renders.
- `<Skeleton name='…' fixture={…}>` for loading states, never a hand-rolled shimmer. The bones
  `calendar-list`, `planner-panel` and `summary` are registered in `modules/bones/registry.ts`; the
  fixtures beside each component are the fallback.

## Screen boundaries

Anything two screens share belongs in `shared/`, never in the other screen's folder. Both directions
between this screen and the homepage used to be crossed and are not any more:

- `SupportButton.tsx` — mounted by `calendar/Calendar.tsx` inside the "this is a Premium feature" toast
  *and* by `pages/homepage/sections/Pricing.tsx` — lives in `shared/`.
- `FaqTabs.tsx`, `Troubleshooting.tsx` and their `types.ts` sat here while `pages/homepage/sections/Faq.tsx`
  was their only consumer; they now live under `pages/homepage/support/`.
- `getViewBoxFromSvg` moved out of `calendar/utils/helpers.ts` into `shared/utils/helpers.ts`, so
  `shared/Icon.tsx` no longer reaches into this screen.

One import still points the other way, and it is a util rather than a component: `Troubleshooting.tsx`
and `pages/homepage/sections/Hero.tsx` both read from this screen's `utils/`, for `getTotalMonths` and
`MODIFIERS_CLASS_NAMES` respectively. Promote either to `shared/` before a third caller appears.

## Testing

Four test files: `ManagementBar.test.tsx`, `SiteTitle.test.tsx`,
`summary/BlocksPerQuarterChart.test.tsx` and `summary/QuarterDistributionChart.test.tsx`. That is not
an oversight to close in passing — the components with tests are the ones holding logic, and the rest
are covered by the Playwright suite in `e2e/`.

The chart tests are the pattern worth copying: mock `recharts` down to inert elements and mock
`@ui/modules/premium/PremiumFeature` to a pass-through, then assert on the data the component derived
rather than on the SVG. Component tests render inside `NextIntlClientProvider` with the real message
bundles, often two locales at once, which is what catches a key that only exists in `en.json`.

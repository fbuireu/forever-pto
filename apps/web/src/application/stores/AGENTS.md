# apps/web/src/application/stores

## Purpose

All client state. Because the planner runs in the browser
([ADR 0001](../../../../../adr/0001-planner-runs-in-the-browser.md)), these Zustand stores are the
product's real database: the Holiday calendar, the Suggestion and its Alternatives, the user's manual edits
and their Premium session all live here and nowhere else. Lose local storage and the plan is gone.

The rest of the application layer contract is in [`../AGENTS.md`](../AGENTS.md).

## Files

| File | Holds |
| --- | --- |
| [`filters.ts`](./filters.ts) | `useFiltersStore`: the planning inputs |
| [`holidays.ts`](./holidays.ts) | `useHolidaysStore`: the calendar, the plan, and the user's edits to it |
| [`location.ts`](./location.ts) | `useLocationStore`: the Country and Region option lists |
| [`premium.ts`](./premium.ts) | `usePremiumStore`: the Premium session and the Premium-required modal |
| [`ui.ts`](./ui.ts) | `useUIStore`: the donate popover and the homepage quick start. `openDonatePopover` and `openQuickStart` each take the trigger that opened them and report it (`donate_opened`, `quick_start_opened`), the way `showPremiumModal` reports its feature; the one store without `persist` |
| [`crypto.ts`](./crypto.ts) | `obfuscatedStorage`, the zustand `PersistStorage` the persisted stores share. Not a store |
| [`rehydration.ts`](./rehydration.ts) | `onRehydrateFailure`, the one thing every persisted store does when a stored blob will not come back. Not a store |
| [`storedPlan.ts`](./storedPlan.ts) | `HOLIDAYS_STORAGE_NAME`, the holidays store's key, and `hasStoredPlan`, which reads whether that blob exists without rehydrating anything (the quick start's resume label, through `useHasStoredPlan`). Not a store |
| [`utils/crypto.ts`](./utils/crypto.ts) | `obfuscate` / `deobfuscate` / `base64Encode` / `base64Decode`, plus `TWENTY_FOUR_HOURS` and `BASE64_PATTERN`. Not a store |
| [`types.ts`](./types.ts) | The action parameter objects shared between the stores and their callers (`GenerateSuggestionsParams`, `FetchHolidaysParams`, `SetCalculationResultParams`, `ToggleDaySelectionParams`, `AddHolidayParams`, `EditHolidayParams`, `AlternativeSelectionBaseParams`, `AlternativePreviewParams`), `holidaysKeyOf`, and the outcomes the actions answer with: `DayRefusal`/`DayChange`/`DayOutcome` and `HolidayRefusal`/`HolidayOutcome` |

## The stores

| Store | Owns | Persisted |
| --- | --- | --- |
| `filters` | `ptoDays`, `allowPastDays`, `country`, `region`, `year`, `carryOverMonths`, `strategy`, `preferredMonths` | all but `year` |
| `holidays` | `holidays`, `suggestion`, `alternatives`, `maxAlternatives`, `currentSelection`, `currentSelectionIndex`, `previewAlternativeIndex`, `manuallySelectedDays`, `removedSuggestedDays`, `isCalculating`, `hasCalculated`, `planRevision`, `holidaysKey`, `planAskedFor` | all but `previewAlternativeIndex`, `isCalculating`, `hasCalculated`, `planRevision`, `holidaysKey` and `planAskedFor` |
| `location` | `countries`, `regions` | nothing |
| `premium` | `premiumKey`, `userEmail`, `lastVerified`, `needsSessionCheck`, `isLoading`, `modalOpen`, `currentFeature` | everything up to `needsSessionCheck` |
| `ui` | `donatePopoverOpen`, `donatePopoverIsOpening`, `quickStartOpen` | nothing |

**`preferredMonths` is guarded on rehydration the way `strategy` is, by the same predicate the worker uses.**
`isPreferredMonths` in `@domain/calendar/window` accepts an array of distinct Planning Window positions, the Carry-over Months included, the empty
one included (which means any month), and a stored value that fails it becomes `DEFAULT_PREFERRED_MONTHS`, which
is empty: a fixed default month stops being reachable once it has passed, and an empty choice is honest about
where the block will go.
`setPreferredMonths` applies it too and stores the months sorted, so the calculation effect that depends on the
array does not re-plan when the same months arrive in another order. The field needs no `STORAGE_VERSION` bump:
a blob without the key takes the initial state's, and the guard covers anything else a hand-edited blob could hold.

`setCountry` clears `region` in the same `set` call: a Region code is only meaningful under its Country, and
leaving a stale one produces a plan with holidays from the wrong place.

**The numeric filters are clamped in the store, because the controls are not the only writers.** `MIN_PTO_DAYS`,
`MAX_PTO_DAYS` and `MIN_CARRY_OVER_MONTHS` live in `filters.ts` and the setters hold them;
[`PtoDays.tsx`](../../ui/modules/sidebar/components/PtoDays.tsx) and [`CarryOverMonths.tsx`](../../ui/modules/sidebar/components/CarryOverMonths.tsx) import the same constants rather than declaring their own. The accrual calculator
in [`PtoCalculator.tsx`](../../ui/modules/sidebar/components/PtoCalculator.tsx) writes a computed budget straight through `setPtoDays` (its `max='8'` is an
HTML attribute, which stops the stepper and not a typed number), and a persisted blob carries whatever a
previous version allowed, so `onRehydrateStorage` clamps as well: `migrate` only runs on a version change, and a
stored out-of-range value would otherwise outlive the bound for ever.

**`MAX_CARRY_OVER_MONTHS` is the one bound that is not declared here, because it is not a UI preference.**
The Holiday source fetches `year` and `year + 1` and nothing else, so a Planning Window wider than `MAX_CARRY_OVER_MONTHS`
enumerates months whose Holiday set is provably empty and scores every Bridge there against
a blank calendar. It lives in [`../../domain/calendar/window.ts`](../../domain/calendar/window.ts) beside the
Planning Window it constrains; `holidayDTO.create` derives its keep window from the same value, this store
imports it as its clamp ceiling, and so does `CarryOverMonths.tsx`.

## Persistence is obfuscated, not encrypted

`crypto.ts` XORs the serialised blob against `NEXT_PUBLIC_STORAGE_KEY` and base64-encodes it. The key ships in
the client bundle, so this is obfuscation and nothing more
([ADR 0007](../../../../../adr/0007-persisted-client-state-is-obfuscated-not-encrypted.md)); the exported names
(`obfuscate`, `deobfuscate`, `obfuscatedStorage`) and the log messages say so, and only the file names read as a
cipher.

The branches, chosen once at module load:

- **No `window`**: a no-op storage, so importing a store on the server neither reads nor writes.
- **Development, or `NEXT_PUBLIC_STORAGE_KEY` missing**: plain local storage. A missing key degrades, it does
  not break, so devtools show readable JSON locally and obfuscated blobs in production.
- **Otherwise**: obfuscated. A failed decode logs and returns `null`, which zustand treats as "nothing
  stored"; the store keeps its initial state rather than crashing.

**A write whose value has not changed is skipped, in both storing branches.** zustand's `persist` saves the
whole partialized slice on every `set`, including the ones that touch only unpersisted fields
(`setCalculating`, the Alternative preview), so without the skip every calculation would re-obfuscate the
holidays blob several times. The obfuscated branch remembers the last value it wrote or read per key and skips
a write of the same value while storage still holds what it wrote, so another tab's write is never mistaken
for its own; the plain branch compares with what is stored. The obfuscation itself works on code units in
chunks rather than one string per character, and its output is byte for byte what the per-character version
wrote, which `utils/crypto.test.ts` pins against that version, so every blob already stored still reads.

**`partialize` is the whole persistence contract.** A field absent from it is browser-session state by
design, and some of those omissions are load-bearing:

- **`year` is not persisted, and `filters.ts` has a `migrate` that strips it.** The bumped
  `STORAGE_VERSION` exists for exactly this: a v1 blob still carries a `year`, and the shallow merge would
  revive last year's value over the current one. Someone returning in January would silently plan the year
  they left.
- **`isCalculating` is not persisted.** It is set true before a worker run and cleared by the response; a
  persisted `true` would rehydrate into a permanently frozen calendar.
- **`previewAlternativeIndex` is not persisted.** It is hover state and is re-derived from
  `currentSelectionIndex` on rehydration.
- **`location` persists nothing at all, and its `migrate` drops whatever it finds.** [`CountriesClient.tsx`](../../ui/modules/sidebar/components/CountriesClient.tsx)
  pushes the server-rendered Country list into the store on mount and [`Regions.tsx`](../../ui/modules/sidebar/components/Regions.tsx) re-derives the Regions
  from the persisted Country, so both fields are overwritten before anything could read a stored copy.
  `STORAGE_VERSION` 3 retires the v2 blobs that carried those lists, and `migrate` returns an
  empty object: dropping is the honest answer here, and without a `migrate` zustand logs an error instead of
  dropping quietly.

**`Date` survives the write and not the read, so only the read half is written.** `obfuscatedStorage`
is a `createJSONStorage`, so what `partialize` returns is `JSON.stringify`d, and `JSON.stringify` already
calls `Date.prototype.toJSON`, which *is* `toISOString`; `partializeHolidays` just names the fields that
persist. `onRehydrateStorage` is the half that does work, mapping them all back through `fromStoredInstant`, the
intake function for values this app itself wrote (see [`../AGENTS.md`](../AGENTS.md)). **Adding a `Date`
anywhere in persisted holidays state means editing that half only**; miss it and you get a string where
the calendar expects a `Date`, which only surfaces at render. [`holidays.test.ts`](./holidays.test.ts) covers the nested case:
`makeSuggestion` builds a real Bridge, and one case asserts `startDate`, `endDate` and `ptoDays[]` come back
as `Date`s through the suggestion, the current selection and an alternative.

`onRehydrateStorage` runs where `localStorage` may be absent, so its error branch reaches it as
`globalThis.localStorage?.` rather than the bare global.

**A rehydrated sealed union is narrowed there too.** The blob is obfuscated,
not encrypted ([ADR 0007](../../../../../adr/0007-persisted-client-state-is-obfuscated-not-encrypted.md)), so
every persisted field is user-editable, and `migrate` runs only on a version change. `filters.ts` narrows
`strategy` with `isFilterStrategy` and falls back to `DEFAULT_FILTER_STRATEGY`, the predicate and the fallback
`worker.ts` applies to the incoming string, so the engine and the screen agree on a stale value: without it,
[`Strategy.tsx`](../../ui/modules/sidebar/components/Strategy.tsx)'s `strategies.find` would match nothing,
and [`Summary.tsx`](../../ui/modules/pages/planner/Summary.tsx), which falls back to the stored Strategy when
the plan names none, would ask next-intl for `sidebar.strategy.<stale>.label`, while the worker planned as the
default.

`holidays.ts` drops a Holiday whose `variant` fails `isHolidayVariant` rather than coercing it, as
`alternatives` drops whatever `reviveSuggestion` cannot revive: there is no safe variant to pick for it, and a
Holiday nothing can classify is one the tables and the charts count differently from each other. See
[`../dto/AGENTS.md`](../dto/AGENTS.md) for what the readers do with a value outside the union.

## Selection indices

`currentSelectionIndex` and `previewAlternativeIndex` address one flat list: **index 0 is `suggestion`, index
*n* is `alternatives[n - 1]`**. There is no separate index space for Alternatives. `setCalculationResult`
builds `[suggestion, ...alternatives]` and indexes into it; `resetManualSelection` and
[`utils/modifiers.ts`](../../ui/modules/pages/planner/utils/modifiers.ts) in the planner both re-derive with the `index === 0 ? suggestion : alternatives[index - 1]`
form. Introducing an off-by-one here silently applies the wrong plan rather than throwing.

The rehydration guard `currentSelectionIndex > alternatives.length` exists because `maxAlternatives` can
shrink between sessions, leaving a persisted index that names nothing. It resets to the base Suggestion.

## Both threads run one pipeline

A plan gets calculated on either of two threads, and they are *callers* of `runPlanningPipeline` under
`@domain/calendar`, not separate implementations:

- **The normal path** is the Web Worker. [`useCalculationsWorker.ts`](../../ui/hooks/useCalculationsWorker.ts) posts to [`worker.ts`](../../infrastructure/workers/worker.ts), which deserialises
  the request, calls the pipeline off the main thread, serialises the result and hands it back through
  `setCalculationResult`. See
  [`../../infrastructure/workers/AGENTS.md`](../../infrastructure/workers/AGENTS.md).
- **The store's own `generateSuggestions` action** calls the same pipeline on the main thread. Its
  one caller is the Troubleshooting reset in [`Troubleshooting.tsx`](../../ui/modules/pages/homepage/support/Troubleshooting.tsx), which fires it after `resetToDefaults()`
  has cleared the manual edits.

Clearing the caches, building the `manual-N` pseudo-Holidays, deriving the budget, the empty guard and
measuring the Suggestion and each Alternative all happen inside the pipeline. What is left here is genuinely
this side's: reading the store and deciding what "nothing to plan" writes to state.

**Every persisted store fails rehydration through `onRehydrateFailure`, and handles the error first.** It
logs `Error rehydrating <storage key>` (the key rather than a prose label, because the key is what a person
debugging goes looking for) with `{ storeName, hasState }` context, and removes the key through
`globalThis.localStorage?.removeItem`, whose guard exists because the callback also runs where `localStorage`
is absent.

- `holidays` and `filters` check the error and return before anything else, so a failed rehydration never
  clamps or revives partial state it is about to throw away; a `filters.test.ts` case sets out-of-range
  values and asserts they are left alone.
- `premium` deliberately does **not** return: it re-reads `error` further down to raise
  `needsSessionCheck`. It is the only one that falls through.
- `location` has the error branch and nothing else.

**The store-side error logs go through `logClientError`.** `logClient` is for anything that is *not* an
error.

**`checkExistingSession` answers one request for concurrent callers.**
`needsSessionCheck` is cleared only *after* `await getExistingSession()`, and `PremiumFeature` runs the check
in its own effect, at call sites all over the screen, one of them per Holiday row. So every instance mounting in the same
commit would read `needsSessionCheck: true` and issue its own `GET /api/check-session`. A module-level in-flight
promise hands the same one back to every caller until it settles.

The deduplication sits here rather than at the component on purpose. Hoisting the effect into a single mount
is the other shape, and [`modules/premium/PremiumSessionSync.tsx`](../../ui/modules/premium/PremiumSessionSync.tsx) already models it for the confirmation page,
but the gate is mounted from several screens and moving the trigger risks a route where the check never
runs at all. Fixing it in the store also covers every future caller. A gate component that *fetches* rather
than *reads* is still the odd part; this makes it cheap rather than correct.

**`checkExistingSession` clears Premium only on an authoritative "no session", never on a failed check.**
`getExistingSession` returns `null` when the server answered and said there is no session (a genuine
expiry, which should clear the stored `premiumKey`), and **throws** when the request itself failed or the
body is neither a session nor the route's no-session answer. Clearing on a throw would let a 500, a dropped
connection or a malformed 200 revoke a donor's Premium locally, which ADR 0008 says never happens: none of them is
the server saying "no session". The store's `catch` deliberately writes only `lastVerified` and
`needsSessionCheck`; adding `premiumKey: null` there is the bug.

**A PTO Day is only ever spent on a Workday, and `toggleDaySelection` enforces it.** Adding a Manual Day is
refused when the date is a weekend or is already covered by any Holiday, Custom included. Both cost a day of
budget and buy nothing, because the day was already off. The guard runs only on the *add* path: a day already in the plan can always
be toggled back off, which matters when a Holiday lands on a Manual Day after the fact (a Country change
re-fetches Holidays) and would otherwise strand it, spending budget with no way to reclaim it.

**The refusal reason crosses the seam, so no caller re-derives the rule.** `toggleDaySelection` returns a
`DayOutcome` and `addHoliday`/`editHoliday` return a `HolidayOutcome`, both declared in `types.ts`, both
either `{ applied: true }` or `{ applied: false, reason }`, with `HolidayOutcome` additionally carrying
`heldBy` so a caller can name the Holiday already on the date without looking it up, and `DayOutcome`
carrying a `change` on success (`DayChange`: a Manual Day added or removed, a Suggested Day removed, a Removed
Day restored), because the store is the only place that knows which of the four a click was and the analytics
event wants to say so without re-deriving it. The reasons are the distinctions the
copy actually needs: a weekend, a National or Regional Holiday and a Custom Holiday are different
refusals because the UI says different things about each.

**One `DayRefusal` is raised by the caller and never by this store.** `PLAN_IN_FLIGHT` is what
[`CalendarList.tsx`](../../ui/modules/pages/planner/CalendarList.tsx)'s `toggleDay` answers while a worker
run is outstanding, so `toggleDaySelection` is not reached at all. It lives in `types.ts` with the rest
because the *shape* is the seam: a caller that refuses on its own grounds still has to answer a `DayOutcome`,
and `DAY_REFUSAL_COPY` is exhaustive over `DayRefusal`, so a reason with no copy decision is a compile error.
Why the guard cannot live in the store: the store has no way to know a request is in flight without the
holidays store reading `isCalculating` inside its own action, and the race is a UI-input problem rather than a
planning rule. See [`../../ui/modules/pages/planner/AGENTS.md`](../../ui/modules/pages/planner/AGENTS.md) for
what the race produces if the guard is removed.

**`heldOn` is that rule inside the store.** `heldOn({ date, exceptHolidayIndex? })` answers
`{ holiday?, manualDay }`: is this date taken, and by what, compared with `isSameDay`. `addHoliday` asks
without an index, `editHoliday` with its own (a Holiday cannot collide with itself, so renaming one without
moving it is never refused), and `toggleDaySelection` reads `.holiday` for its Holiday check and `.manualDay`
for its Manual Day one. The refusal *shapes* stay different; the rule is one.

A stored date is always a `Date` by the time an action runs, because `onRehydrateStorage` revives
`state.holidays` before anything can read it. Zustand types the callback's argument as the live store, where
every date field is a `Date`, while what arrives is whatever `JSON.parse` produced: strings. `Stored<T>` in
[`dateIntake.ts`](../shared/utils/dateIntake.ts) maps a shape's `Date`s to `string`s, and the callback casts
**once**, to `Stored<PersistedHolidays>`, then reads from `stored` and writes back into `state`.
`fromStoredInstant` takes a `string`, so coercing a date downstream is a compile error, and the rehydration
seam is its only caller in this layer.

**Only `triggerCalculation` raises `isCalculating`, and only a worker reply clears it.** Nothing else in the app sets it back to false: `useCalculationsWorker`'s callbacks and its
unmount cleanup are the whole list, and the cleanup is gated on a request actually being in flight. The only
thing that starts a run is `CalendarList`'s effect, keyed on the planning inputs (year, Carry-over Months,
budget, past days, Strategy, Preferred Months, locale), the Holidays and whether they are current, and
`planRevision`. So a caller that raises the flag without moving one of those freezes the planner: the
month grid takes `pointer-events-none` and both remaining-budget readouts stick on their last settled value,
with no spinner and no error. That is why no budget writer raises it, not even to spare the readout a frame of
flicker: writing a value equal to the current one, or any value while no Country is picked, would leave it up
for good. The flag belongs to the one function that also clears it. The budget writers still return early on
an unchanged value, because that spares a pointless worker run.

**`planAskedFor` tells the worker's answer whether a person asked for it.** A handler that changes what the
plan is built from calls `askForPlan`, and `useCalculationsWorker` reports `planner_generated` only when
`claimPlanAskedFor` hands it that ask, which the claim consumes. A load, a restore or a rehydration asks
nothing, so the plan it settles reports nothing, and asks that settle as one run report once. The flag is not
persisted, so a reload cannot carry an ask into a restore. A handler asks only when its write changes
something, because an ask no run follows waits for the next plan, which may be a restore: the budget writers
return early on an unchanged value, the Country, Region, year, Strategy and Carry-over Months controls compare
before asking, a Custom Holiday asks only once it lands, and the delete only with Holidays to remove. The flag
lives here rather than in the filters store because `StoresInitializer` calls `setCountry` from an effect, so
a filters write is not always a person asking.

**Applying an Alternative re-plans, and that is what makes the hand edits safe to keep.** Things about a
stored Suggestion go stale the moment it is adopted, and neither can be repaired locally:

- Its size. The worker built it against the Remaining Budget **at that run**, and `toggleDaySelection`
  deliberately never re-plans, so a Manual Day added afterwards is unreserved in every stored plan. Keep the
  Manual Days and `days.length + manuallySelectedDays.length` can exceed the budget; `measureBudget` clamps the
  Remaining Budget at zero, so the overdraft reads as nothing left rather than as a negative allowance: correct
  for the user, and invisible to anyone debugging.
- Its Bridges. They were expanded through the Manual Days as pseudo-Holidays, so clearing those days leaves
  spans crossing dates the calendar now paints as Workdays. Effective Days do not read the spans (they are the
  free streaks around the placed days, so they drop correctly), but `bridgesUsed` still counts those Bridges and
  every one of them describes a stretch that is no longer there.

Clearing the Manual Days fixes the first and causes the second; keeping them does the reverse. So the action
keeps them (every Alternative was planned *around* them, and its
Metrics were measured *with* them) and bumps `planRevision`, which `CalendarList` carries in its calculation
effect's dependencies. A fresh run then sizes the budget against the current manual count and rebuilds the
Bridges against the current calendar, and `setCalculationResult` preserves the index the user picked. An
apply therefore costs one worker round trip; that is the price of both guarantees. Removing the bump, or
dropping `planRevision` from those dependencies, silently restores whichever half of the bug the other
choice would have caused.

**`resetManualSelection` bumps it too, and for the mirror-image reason.** It clears the Manual Days rather
than keeping them, and the plan it restores was built against a budget that reserved them,
so without a re-plan the freed budget is never spent again, and the restored Suggestion's Metrics were
measured *with* the Manual Days included, over Bridges expanded through them as pseudo-Holidays. Recomputing
`generateMetrics` the way `toggleDaySelection` does would fix the stale numbers and not the unspent budget;
only the bump fixes both, because the follow-up run sends no Manual Days, no Removed Days and therefore no
`autoSuggestCount` cap, and re-plans the whole budget. Every `set` branch carries it, including the one
that runs with no `currentSelection`.

**`clearCalculation` is the only way a plan is discarded without a new one replacing it.** It nulls the
Suggestion, the Alternatives and the current selection, drops the Removed Days and marks `hasCalculated`, so
the planner shows its settled-empty state rather than a skeleton. Its one caller is `CalendarList`, when the
calculation gate closes while a plan is still standing; see
[`../../ui/modules/pages/planner/AGENTS.md`](../../ui/modules/pages/planner/AGENTS.md).

**`editHoliday` carries the same collision rule as `addHoliday`, because moving a Holiday onto a date is
the same act as creating one there.** It refuses a target date already held by another Holiday or by a
Manual Day. The store comparison skips the entry being edited, so renaming a Holiday without moving it is
never blocked by itself.

**A date is occupied by a Holiday *or* by a Manual Day, and `addHoliday` refuses both.** A Custom Holiday on a
date the user has already spent budget on would count against the allowance while being a non-working day, so
the PTO Day would be paid for and buy nothing. The check lives in the store alone, and the modals render
whichever refusal comes back.

**The Troubleshooting reset clears the planning stores and deliberately not the Premium one.** Its copy promises that
clearing local storage "resets everything back to defaults", so it calls `resetToDefaults` on the holidays
store *and* on the filters store; clearing only the first would leave a corrupt Country, Region or budget in
place while telling the user all data had been reset, which is precisely the state the button exists to escape.
It then re-reads the filters through `getState()` rather than the values captured before the reset, and
skips the re-fetch entirely when the default empty Country is what it finds; fetching against `''` would
plan a year with no Holidays in it. `usePremiumStore.resetPremiumStore` is **not** called and must not be:
Premium is derived from the payment record and access is never revoked from a donor
([ADR 0008](../../../../../adr/0008-premium-derived-from-payment.md)), so a troubleshooting button that
logged a paying user out would be a defect, not a more thorough reset. That action having no caller is the
correct state, not dead code to wire up.

**The pipeline's rules on these inputs live in `runPlanningPipeline`, once.** They are documented here
because they are what the pipeline does with what this store hands it, and getting the *inputs* wrong still
produces a wrong plan:

- **Manual Days become `manual-N` pseudo-Holidays of Variant Custom**, so the engine cannot re-suggest a date
  the user has already spent budget on.
- **Removed Days do not.** They travel as the engine's `removedDays` parameter, which reaches
  `getAvailableWorkdays` and nothing else: a day the user told us they will work stops being a placement
  candidate without becoming a Free Day. Routed through the holidays array, it would count as a Free Day when a
  neighbouring Bridge expanded and was scored, inflating its Efficiency.
- **The budget is `autoSuggestCount ?? measureBudget({ ptoDays, manuallySelectedDays }).remaining`.** Only the
  worker path sends `autoSuggestCount`, which `useCalculationsWorker.ts` derives after a manual edit; this
  store's `generateSuggestions` sends none, because its one caller runs after the manual edits are cleared.
- **The pipeline measures every plan against the Planning Window it is handed**, `window: { year, carryOverMonths }`,
  and both callers pass the filters' own.
- **Neither caller guards on the Holiday count.** A weekend is a Free Day, so a Bridge needs no Holiday at
  all: with none, a Friday still expands into the weekend beside it, at an Efficiency of 3.0. The pipeline
  short-circuits on an empty *candidate* set instead, which is the condition the run cannot proceed without.
  See [`@domain/calendar/AGENTS.md`](../../domain/calendar/AGENTS.md).

The `generateSuggestions` block in `holidays.test.ts` asserts what this caller hands the pipeline, and
[`worker.test.ts`](../../infrastructure/workers/worker.test.ts) does the same for the worker; the pipeline's own behaviour is tested once, in [`pipeline.test.ts`](../../domain/calendar/pipeline.test.ts), against the real engine.

**"Nothing to plan" is the pipeline's own judgement, and this store must not second-guess it.** It means an
exhausted budget or an empty candidate set, nothing about how many Holidays arrived.
[`../../ui/modules/pages/planner/CalendarList.tsx`](../../ui/modules/pages/planner/CalendarList.tsx) gates
the worker path on `holidays.length > 0`, a guard the pipeline does not apply, so a Holiday-free calendar
plans through the Troubleshooting reset, which calls `generateSuggestions` with no gate, and not through the
normal path.

**The sides differ on what "nothing to plan" *writes*, and that is the one deliberate difference.** The pipeline answers `planned: false` with an empty Suggestion whose Metrics are real; the worker
forwards it as-is, because the wire type has no null, while this store maps it to `null` across `suggestion`,
`alternatives` and `currentSelection`, its existing "no plan" state, which the calendar already renders.

The pipeline and [`getHolidays.ts`](../../infrastructure/services/holidays/getHolidays.ts) are reached through `await import(...)` inside the actions, not top-level
imports, and so is [`getRegions.ts`](../../infrastructure/services/regions/getRegions.ts) inside `location.ts`'s `fetchRegions`. That keeps the bulk of the planner and the
`date-holidays` dataset out of the bundle any page that merely touches the store would otherwise pull in.

**The engine modules `toggleDaySelection` needs are imported statically.** It is synchronous and returns a
`DayOutcome`, so it cannot await an import without changing its signature and every call site with it.
`generateMetrics` (with [`metrics/utils/helpers.ts`](../../domain/calendar/metrics/utils/helpers.ts) behind it) and `measureBudget` therefore land in any
chunk that reads this store, as `window.ts` does for `fetchHolidays` and `pruneDaysOutsideWindow`. Making them
dynamic is not a tidy-up either.

## Logging is reached through a dynamic import

**No file here imports `@infrastructure/logging/logger` statically, and none holds a module-scope `logger`.**
`logClient` and `logClientError` in `@application/shared/utils/clientLog` reach it through `import()`, and
`clientLog.test.ts` pins that. The logger imports only `contract.ts`, so the dynamic import keeps nothing heavy out
of a chunk, and [ADR 0018](../../../../../adr/0018-the-platform-is-the-log-transport.md) leaves it in place until
that is decided on its own. `logClient((logger) => logger.warn({ message, context }))` is for anything but an error,
and `logClientError({ message, error, context })` for an error.

**Nothing awaits that import.** Several of these actions are called synchronously from React
(`addHoliday`, `toggleDaySelection`, every `onRehydrateStorage` listener), so awaiting would turn a
synchronous action asynchronous and change its return type. The consequence is that a log lands a microtask
after the action returns, and a log emitted during a teardown may never be flushed.
[`logging/better-stack/tracking.ts`](../../infrastructure/clients/logging/better-stack/tracking.ts), which `premium.ts` and `ui.ts` import statically for `track()`, is a
different module with no SDK behind it.

## Gotchas

**`fetchHolidays` and `fetchRegions` do no network I/O**, whatever their names say. Both resolve out of the bundled
`date-holidays` dataset in the browser: `getHolidays.ts` is `async` but local, and `getRegions.ts` is outright
synchronous. Both stores import their lookup with a dynamic `import()`, never a static one: the
dataset is about 280 KB compressed, and a static `getRegions` import in `location.ts` would put it in the
planner's first load through every component that reads the Countries, however carefully `fetchHolidays`
deferred its own. `location.test.ts` reads the store's source to keep it out. Nothing in this folder makes an HTTP request except `premium.ts`, which calls
`/api/check-session` through `@ui/adapters/session/checkSession`.

**`holidaysKey` says which filters the Holidays were fetched for, and a fetch that was overtaken is
dropped.** `fetchHolidays` records `holidaysKeyOf(params)` beside the Holidays it sets, on the catch branch as
on success, and `CalendarList` plans only while that key matches the filters on screen. The key is
deliberately not in `partialize`: after a reload the persisted Holidays are for whatever was on screen last,
and the planner waits for the fresh fetch instead of planning on them. Each call also takes a sequence number
and gives up if a newer call started while it awaited, so a slow answer for the previous year cannot overwrite
the current one.

**A Custom Holiday wins the date it lands on.** `fetchHolidays` keeps the existing Custom Holidays, drops any
fetched Holiday sharing a date with one, and re-sorts. `editHoliday` rebuilds through
`holidayDTO.createCustom`, so editing a National or Regional Holiday converts it to a Custom one and it will
survive the next fetch; that is the intended behaviour, not a leak.

**The budget arithmetic is not written here.** `measureBudget` under `@domain/calendar/utils` owns it, and
`toggleDaySelection` asks it whether anything is left.

**`toggleDaySelection` recomputes metrics but does not re-plan.** It moves a date between
`manuallySelectedDays` and `removedSuggestedDays`, calls `generateMetrics` with the updated sets against the
filters' Planning Window, writes the result onto `currentSelection` and answers `{ applied: true, change }`,
leaving `suggestion` and `alternatives` untouched. With the budget exhausted it answers a `BUDGET_EXHAUSTED`
refusal and changes nothing. Re-planning is a separate worker run.

**`needsSessionCheck` decides when the cookie is consulted, not what is authoritative.** The client-side Premium gate is the persisted `premiumKey` itself ([ADR 0007](../../../../../adr/0007-persisted-client-state-is-obfuscated-not-encrypted.md)); the cookie only seeds it. The premium session is a signed HTTP-only
cookie, not store state ([ADR 0008](../../../../../adr/0008-premium-derived-from-payment.md)); `premiumKey`
here is a cache of it. `onRehydrateStorage` raises `needsSessionCheck` whenever this device has no fresh
verification (never verified, verified more than `TWENTY_FOUR_HOURS` ago, or nothing decoded), so a valid
cookie restores access without the user retyping their email. `checkExistingSession` is a no-op unless the
flag is up or the caller forces it, which is why every consumer can call it unconditionally.

**`premium_activated` fires on the transition into Premium, not on every `setPremiumStatus`.**
The guard is the previous `premiumKey`: no key before, a key after. Without it, any second call would have
counted another activation for the same donor. `checkExistingSession` restores the same entitlement from the
cookie and deliberately emits nothing: a session restored on a second device is not a second activation.

`refreshPremiumStatus` is the action that guard was written for, and it currently has **no caller** outside
its own test: nothing re-verifies the stored email on a later visit, so `setPremiumStatus` is reached only
from the checkout and the "I already donated" modal. Treat it as an entry point that is wired up but unused,
not as live behaviour, and keep the guard, because the moment anything calls it on mount the double-count
is back.

**`holidays.ts` reads `useFiltersStore.getState()` inside actions**, which is not reactive: an action sees whatever
was in the other store at call time. `fetchHolidays` does not read `useLocationStore` for the Region labels: that
store is filled by `Regions.tsx`'s effect, `CalendarList`'s effect is what calls `fetchHolidays`, and both components
are `dynamic()`-imported from different levels, so chunk arrival would decide which runs first. `getHolidays` derives
the list itself; see
[`../../infrastructure/services/holidays/AGENTS.md`](../../infrastructure/services/holidays/AGENTS.md).

**`crypto.ts` is not a store, and neither file is crypto.** `TWENTY_FOUR_HOURS` lives in `utils/crypto.ts` only
because `premium.ts` needs it and there is no other shared constants module.

## Testing

Each store has a co-located `.test.ts` and none of them mounts React. The shared setup is worth copying:
`vi.mock('./crypto')` replaces `obfuscatedStorage` with a triple of stubs so persistence never touches the
real `localStorage`; `vi.mock` on `@infrastructure/logging/logger` stubs the `logger` export;
`beforeEach` resets with `useXStore.setState(useXStore.getInitialState())`, so no test inherits another's
`holidaysKey` or `planRevision` and a field the store gains is reset with no test naming it. Tests then drive actions through
`getState()` and assert on `getState()`.

**A logging assertion has to wait for the dynamic import.** The `vi.mock` still intercepts it, but the spy
has not been called when the action returns, so the assertion is `await vi.waitFor(() => expect(spy).toHaveBeenCalledWith(…))`.
The spies are hoisted with `vi.hoisted` and handed to the mocked `logger` object so a test can reach
them at all. Several of these tests assert `expect(spy).not.toHaveBeenCalled()` *before* the `waitFor`: that
line is the one that fails if someone converts the import back to a static one, and it is the reason the
assertion is worth the line it costs.

Anything the store reaches through `await import(...)` (the pipeline, `getHolidays.ts`, `getRegions.ts`) is
mocked by module path. `generateMetrics` is mocked the same way despite being a static import; the path
is what the mock keys on, not the import style. [`crypto.test.ts`](./crypto.test.ts) is the exception that has to re-import: it uses `vi.resetModules()` with
`vi.stubGlobal('window', …)` and `vi.stubEnv`, because the storage branch is decided once at module load.

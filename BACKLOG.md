# Backlog

The defects the tree carries today and has not fixed yet. An item leaves in the change that fixes it, or when it is
decided against; an item that turns into a real decision becomes an ADR instead.

## Known breaches of the coding standards

Each line names where the tree breaks a rule of [`CODING_STANDARDS.md`](./CODING_STANDARDS.md) and the fix that closes it.

- **`activateWithPayment` and `activateWithClaimedPayment` are not `Effect.gen`, and they return the
  `DonationActivation` alias** (`A3`, in `apps/web/src/application/use-cases/activatePremium.ts`): write each as
  `Effect.gen` with its `Effect.Effect<A, E, R>` spelled out at the export, or amend `A3` to admit a named alias over a
  thin delegate.
- **The deferred `updatePaymentStatus` failure is logged at `error`, though the Stripe webhook repairs it** (`E7`, same
  file): log it at `warn`.
- **`getPaymentById` has no production caller** (`F5`, `apps/web/src/infrastructure/services/payments/repository.ts`):
  only tests keep it, so delete it with its tests and the doubles that stub it.
- **The donation metadata keys are written in `provider/intent.ts` and read in `provider/metadata.ts`** (`I11`): add
  a `donationMetadata` builder to `provider/metadata.ts` and build `createPaymentIntent`'s `metadata` with it.
- **The CDN strategy logs `context: { error }`, which serialises as `"error":{}`** (`E11`,
  `apps/web/src/infrastructure/services/location/utils/strategies.ts`): log the failure's own fields, `reason:
  error.message`.
- **Methods that take two positional parameters** (`F1`): `TursoService`'s `query` and `execute` (`sql`, `args`),
  `StripeServerService`'s `webhooks.constructEvent` (`payload`, `signature`, two strings in a row) and
  `charges.retrieve`, `DriverClient.start` (`steps`, `overrides`) and the premium store's `showPremiumModal`
  (`feature`, `origin`): give each one object, with its call sites and the `mock.calls` assertions in the same change.
- **`showPremiumModal` defaults `origin` to the planner** (`M3`), so a trigger that forgets it is counted as one:
  make `origin` required.
- **`runPlanningPipeline` defaults `manuallySelectedDays` and `removedSuggestedDays` to `[]`** although both of its
  production callers pass them (`M3`, `apps/web/src/domain/calendar/pipeline.ts`): make them required and add them to
  the base input in `pipeline.test.ts`.
- **`PlanningInput` names `runPlanningPipeline`'s parameter object** (`F1`): rename it `RunPlanningPipelineParams`,
  with the worker guide, the title in `worker.test.ts` and the two wiki pages that draw it.
- **Identifiers built on retired words** (`N1`): `FilterStrategy`, `isFilterStrategy` and `DEFAULT_FILTER_STRATEGY`
  ("filter" for Strategy), `FirstLastBreak` and `getFirstLastBreak` ("break"), `SHOWCASE_RATIO` ("ratio" for
  Efficiency), `manuallySelectedDays` ("selected day" for Manual Day, a persisted key, so the stored blob migrates with
  it) and `dayOffKeys` in `metrics/utils/dayOff.ts` ("day off"): rename each with its callers, the guides, the wiki
  pages and the demos that name it, giving `CONTEXT.md` a term for the placed days plus the Holidays first.
- **Product copy that still names a concept by a retired word** (`N1`, in all six bundles): "days off" for Effective
  Days or for PTO Days and Holidays together (`summary.yearSummary.featureDescription`,
  `summary.summaryParagraph.noRegionHint`, `charts.daysOffComposition` and `daysOffCompositionFeature`,
  `sidebar.strategy.optimized.description`), "auto-assigned" and "manually selected" days for Suggested and Manual
  Days (`tutorial.steps.statusDescription` and `calendarDescription`), "unused days" and "remaining days" for the
  Remaining Budget (`tutorial.steps.toolsDescription`, `ptoDays.clickToAssign`, `premium.unlockDescription`) and
  "break" for a Rest Block (`summary.yearSummary.firstBreak` and `lastBreak`): reword each with the canonical term.
- **Numbers on the planner with a glyph glued on** (`L3`): the `x` after the Efficiency, the sign of its difference,
  the `%` of the comparison and the `(+…)` around the Bonus Days in `PlannerPanel.tsx`, the `✓` before
  `ptoStatus.allAssigned`, and the Gain's `toFixed(0)` with its `%` and the `+` before the Bonus Days in `Summary.tsx`:
  format each with `format.number` (`signDisplay`, `style: "percent"`) or place it in a message around the counter.
  The month header of `calendar/Calendar.tsx` joins two `formatDate` calls (`A7`): format the month and the year
  as one date pattern and style its parts.
- **`MonthlyDistributionChart` sizes its axis from the filters' window and pads the engine's array with zeros**
  (`U23`): size it from `monthlyDist.length`, drop `carryOverMonths` from its props, and rewrite the test that asserts
  the padding.
- **The 203 Countries are written three times**: twice in `sections/Features.tsx`, where `+197` is that count minus
  the flags shown, and once in `sections/Stats.tsx` (`A15`): one `COUNTRY_COUNT` in `sections/shared.ts`, with the
  `+N` derived from it.
- **`Calendar.tsx` and `HolidaysTable.tsx` filter `isInPlanningWindow` by hand**, though `holidaysInPlanningWindow`
  owns that rule (`F6`): call it.
- **`MonthToggles` reads `startOfToday()` during render** (`U19`): the prerendered sidebar disables the months past at
  build time, and hydration keeps those `disabled` attributes once the month moves on, so `today` starts `null` and is
  set in an effect, as in `Calendar.tsx`.
- **`Combobox.test.tsx` asserts that the hard-coded listbox id is absent with the list closed** (`T4`): open the list,
  assert the listbox under its generated id, then the absence.
- **The cookie banner declares `role="dialog"` without the dialog's keyboard model** (`X2`, `CookieConsent.tsx`):
  focus does not move into it when it appears; move focus in and back once it is answered, or drop the role for a
  labelled `region`.
- **`holidays.test.ts` re-implements `holidayDTO.createCustom`, and the use-case tests stub `paymentDataDTO.create`**
  (`T3`): run the real DTO over fixtures.
- **`hasSucceeded`, `wasCharged` and `holidaysInPlanningWindow` are rules, not mappings, yet live in `dto.ts`** (`A14`):
  move them to a `rules.ts` in their folders.
- **Components in a folder their callers do not share** (`U8`): `ThemeSelector` sits in `sidebar/components` while
  `shared/Header.tsx` mounts it too, and `DevFooter` imports `Me` from `pages/legal`: move both to `shared/`.
- **`SidebarCollapsibleGroup` takes its `trigger` as an element a server component built, and one that arrives lazy
  makes Base UI draw a `<button>` of its own** (`U19`, `AppSidebar.tsx` and `SidebarCollapsibleGroup.tsx`):
  `CollapsibleTrigger`'s `asChild` hands the element to Base UI's `render`, which clones only a valid element, so a lazy
  one leaves a `<button>` around the `SidebarMenuButton` and the first client pass does not match the server's (seen
  in 3 of about 70 loads, intermittent): give `SidebarCollapsibleGroup` the icon and the label as props and let it draw
  the `SidebarMenuButton` itself.
- **`premium_activated` is counted again when a visitor returns to the payment confirmation page with `localStorage`
  cleared and the session cookie alive** (`P1`, `confirmActivation` in `apps/web/src/application/stores/premium.ts`):
  the store starts without Premium, `checkExistingSession` finds the cookie and the move reads as an activation, though
  P1 says never on a reload: have `verifySession` return the token's `iat`, `/api/check-session` answer it, and
  `confirmActivation` report only a session issued in the last few minutes.

# apps/web/src/ui/modules

Every React component the product renders. Nothing else in `src/ui/` holds components: `hooks/`,
`utils/`, `adapters/`, `styles/`, `assets/` and `i18n/` are support code, and the route files under
`src/app/` are thin: they compose modules and pass `locale` down.

## Layout

| Folder | Holds | Reused across screens? |
| --- | --- | --- |
| `core/` | The design system: `primitives/` plus the `animate/` layer. See [core/AGENTS.md](./core/AGENTS.md) | Yes, everywhere |
| `pages/` | One folder per screen: `homepage/`, `planner/`, `legal/`, `error/`, `not-found/`. See [pages/planner/AGENTS.md](./pages/planner/AGENTS.md). `homepage/quick-start/` is the stepped dialog every planner call to action on the homepage opens, see below | No, by definition |
| `shared/` | Cross-page pieces that are not primitives: footer, donate, contact, cookie consent, JSON-LD, the marketing header [`shared/Header.tsx`](./shared/Header.tsx) with its [`shared/HomepageLanguageSwitcher.tsx`](./shared/HomepageLanguageSwitcher.tsx) and [`shared/QuickStartTrigger.tsx`](./shared/QuickStartTrigger.tsx), which the homepage, the legal pages and the 404 page render, [`shared/Logo.tsx`](./shared/Logo.tsx), [`shared/Icon.tsx`](./shared/Icon.tsx), [`shared/FormButtons.tsx`](./shared/FormButtons.tsx), [`shared/StepOutcome.tsx`](./shared/StepOutcome.tsx), [`shared/SupportButton.tsx`](./shared/SupportButton.tsx), [`shared/ConditionalWrapper.tsx`](./shared/ConditionalWrapper.tsx), [`shared/WebMCP.tsx`](./shared/WebMCP.tsx), and what the sidebar and the quick start share: [`shared/MonthToggles.tsx`](./shared/MonthToggles.tsx), the month picker, and [`shared/strategyIcons.ts`](./shared/strategyIcons.ts), the Strategy icons; plus [`shared/utils/helpers.ts`](./shared/utils/helpers.ts) for the helpers those pieces need | Yes |
| `layout/` | [`layout/LegalLayout.tsx`](./layout/LegalLayout.tsx), the card chrome the legal pages share, and [`layout/SkipToContent.tsx`](./layout/SkipToContent.tsx), which owns the skip link **and** the `MAIN_CONTENT_ID` every route shell's landmark is keyed on | Between sibling routes |
| `sidebar/` | [`sidebar/AppSidebar.tsx`](./sidebar/AppSidebar.tsx) and its controls: Country, Region, year, Strategy and its Preferred Months, past days, Carry-over Months, the PTO Day budget, the calculators, the calendar export, and the language and theme switchers | One screen, but not a page section |
| `premium/` | The Premium gate and the Donation checkout: [`premium/PremiumFeature.tsx`](./premium/PremiumFeature.tsx), [`premium/featureLabels.ts`](./premium/featureLabels.ts), [`premium/PremiumModal.tsx`](./premium/PremiumModal.tsx), [`premium/PremiumRequiredModal.tsx`](./premium/PremiumRequiredModal.tsx), [`premium/CheckoutForm.tsx`](./premium/CheckoutForm.tsx) with its [`premium/ExpressCheckoutFixture.tsx`](./premium/ExpressCheckoutFixture.tsx), and [`premium/PremiumSessionSync.tsx`](./premium/PremiumSessionSync.tsx), the render-nothing activation check the payment confirmation mounts | Yes |
| `providers/` | What the locale layout mounts once around the page: [`providers/AppThemeProvider.tsx`](./providers/AppThemeProvider.tsx), the `next-themes` context, which stamps `<html>` with the theme as `data-theme` (the tokens) and as a class (the `boneyard-js` skeletons) and which the two global pages mount too, and [`providers/BonesProvider.tsx`](./providers/BonesProvider.tsx), which renders `null` and configures `boneyard-js` | Once |
| `stores/` | [`stores/StoresInitializer.tsx`](./stores/StoresInitializer.tsx), a render-nothing component that seeds the filters store from the `user-country` cookie, read through [`utils/userCountry.ts`](../utils/userCountry.ts) | Once |
| `tutorial/` | [`tutorial/anchors.ts`](./tutorial/anchors.ts), the tour's anchor names and window events, and [`tutorial/DriverStyles.tsx`](./tutorial/DriverStyles.tsx), the module `useTutorial` imports for the driver.js stylesheet | Once |
| `tracking/` | The third-party script mounts: [`tracking/Analytics.tsx`](./tracking/Analytics.tsx) (Google gtag consent defaults and config; nothing at all when the build has no `NEXT_PUBLIC_GOOGLE_ANALYTICS_ID`, so a preview or a local build loads no Google script) and [`tracking/BetterStackTracking.tsx`](./tracking/BetterStackTracking.tsx) (the Better Stack snippet, gated on the cookieconsent `betterStack` **service**, not the category) | Once |
| `export/` | [`export/HolidayDocument.tsx`](./export/HolidayDocument.tsx), the `@react-pdf/renderer` document tree (not DOM React; it renders in the PDF reconciler only), and [`export/exportPdf.tsx`](./export/exportPdf.tsx), the Effect program that renders it and hands the file over | Once |
| `bones/` | Generated skeleton data, see below. Not hand-written | n/a |

## File names

**`*Client.tsx` means more than one thing.** The suffix is not a single convention, and reading it as
one will mislead you:

- A `'use client'` shell that `dynamic()`-imports the real component with `ssr: false` and forwards its
  props, so the component and what it drags in stay out of the server render:
  [`shared/donate/DonateClient.tsx`](./shared/donate/DonateClient.tsx),
  [`shared/cookie-consent/CookieConsentClient.tsx`](./shared/cookie-consent/CookieConsentClient.tsx), and
  [`pages/homepage/quick-start/QuickStartClient.tsx`](./pages/homepage/quick-start/QuickStartClient.tsx),
  which also waits for the first open.
- The interactive half of a server/client pair, where the server sibling reads the data:
  [`sidebar/components/Countries.tsx`](./sidebar/components/Countries.tsx) reads `getCountries` and hands the result to
  [`sidebar/components/CountriesClient.tsx`](./sidebar/components/CountriesClient.tsx). [`pages/homepage/sections/HomepageCta.tsx`](./pages/homepage/sections/HomepageCta.tsx) and
  [`pages/homepage/sections/CtaShapesClient.tsx`](./pages/homepage/sections/CtaShapesClient.tsx) are the same pair for translated strings.

**`*Fixture.tsx` is a static placeholder**, not a test fixture. See the skeleton section.

## The quick start

Every planner call to action on the homepage (the header's trial action, the hero, the free plan in
`Pricing.tsx` and the closing section) is a [`shared/QuickStartTrigger.tsx`](./shared/QuickStartTrigger.tsx), a
button that calls `openQuickStart(source)` on the `ui` store, not a link into `/planner`. The header's trial
action is the one exception, and only for a returning visitor: it passes a `resumeLabel`, and once
`useHasStoredPlan` finds the holidays store's key in local storage the trigger renders that label as a link
straight to `/planner`. The check is presence of the key, read through
[`application/stores/storedPlan.ts`](../../application/stores/storedPlan.ts), never a parse of the blob: it is
obfuscated, and reading it would pull the whole holidays store into the homepage. The server snapshot is
`false`, so the prerendered header always offers the trial and hydration swaps in the link.

The dialog is mounted once, from the marketing layout, as
[`pages/homepage/quick-start/QuickStart.tsx`](./pages/homepage/quick-start/QuickStart.tsx): a server component
that reads the Country list and the current year and hands them to
[`pages/homepage/quick-start/QuickStartClient.tsx`](./pages/homepage/quick-start/QuickStartClient.tsx). The
year is read when the page is prerendered, so the year chips follow the build, not the visitor's clock, until
the next deploy. The shell renders nothing until the store's flag first turns true (`useHasOpened`, state set
during render rather than in an effect, so the dialog mounts in the click's own render), and only then
`dynamic()`-imports, with `ssr: false`,
[`pages/homepage/quick-start/QuickStartDialog.tsx`](./pages/homepage/quick-start/QuickStartDialog.tsx) and the
Premium modal beside it: a visitor who never clicks a call to action downloads neither, nor the Counter, nor
the Stripe client the Premium modal reaches. The Regions lookup loads later still, inside the location store's
`fetchRegions`, because it drags `date-holidays` in. Once opened the pair stays mounted, so the close animates
and a second open fetches nothing. The content is
[`pages/homepage/quick-start/QuickStartForm.tsx`](./pages/homepage/quick-start/QuickStartForm.tsx), one
component per step beside it, and [`pages/homepage/quick-start/steps.ts`](./pages/homepage/quick-start/steps.ts)
for the step list, the draft shape and the pure rules.

**The steps ask what the sidebar's first three cards hold, one at a time, with the year moved next to the
budget.** Location (the Country the filters store already holds, else the `user-country` cookie, and an
optional Region), the PTO Day budget with the year (four chips from `yearOptions`, not the sidebar's ten), then
Strategy (with the Preferred Months when it is Main Vacation), past days and Carry-over Months. The last two sit
behind the same `PremiumFeature` gate the sidebar uses, which is why `QuickStartClient.tsx` mounts
`PremiumModal`: the marketing layout mounts none, and a gated control whose click opens nothing reads as broken.

**The form edits a draft and writes the store once, on the last step.** Closing the dialog before that
changes nothing, which the sidebar controls, writing on every change, cannot offer. Base UI unmounts the
popup when the dialog closes, so the draft resets for free: it is a `useState` initialiser seeded from
`useFiltersStore.getState()` and the cookie, not an effect keyed on `open`. On finish the form calls the
same setters the sidebar does, in the order that survives `setCountry` clearing the Region, closes, and
pushes `/planner` through `@application/i18n/navigation`, where `CalendarList.tsx` recomputes from the
store. No search params are involved.

**The funnel is reported from the handlers, and a finish is never counted as an abandonment.**
`openQuickStart(source)` reports `quick_start_opened` with the call to action, which is why `QuickStartTrigger`
takes a `source`; the form reports `quick_start_step_completed` from Next and `quick_start_completed` from
the finish, with `trackedDraft(draft)`. The dialog reports `quick_start_abandoned` from `onOpenChange(false)`
(the close button, the backdrop, Escape), naming the step the form last announced through `onStepChange`; a
finish closes through the store, which fires no `onOpenChange`.

**The planner reports its own interactions the same way, from the handler.** Every sidebar control, the day
click, the Alternatives, the Custom Holiday modals, the export, the calculators, the tutorial, the language and
theme switchers and the contact form call `track()` where the interaction lands; the catalogue is the
observability page of the docs site. The store actions that report are the opens several triggers share, so each trigger reports the same event
with its own `source` (`openDonatePopover(source)` and `openQuickStart(source)` on the `ui` store,
`showPremiumModal(feature, origin)` on the premium store), and `setPremiumStatus`, which reports
`premium_activated` on the move from free to Premium only, as `confirmActivation` does for the payer the issuer
redirected, from the confirmation page and only while the redirect's `activation=fresh` marker is in the address. `planner_generated` counts the plans a person asks
for: every handler that changes what the plan is built from calls the holidays store's `askForPlan` (a sidebar
control or the calculator on a new value, the quick start's finish, a Custom Holiday that lands or goes, an
Alternative applied, a reset), and `hooks/useCalculationsWorker.ts` reports it when the worker's answer lands and
`claimPlanAskedFor` hands it that ask, the one place that holds the inputs and the measured plan together. A load
or a restore asks nothing and reports nothing. It reports the plan's quality metrics and never its days. The one
`track()` an effect runs is `Contact.tsx`'s `contact_opened` with `source: hash`, which counts the view a
`#contact` link opens rather than an interaction, and the contract suite fails on any other. The budget is a setting
and travels as its number, which is a decision the docs site's data sources page states. `track()` itself fans
every event out to Better Stack and to Google Analytics under the same name, so the call sites know nothing
about destinations; the split of what each one is for is on the docs site's observability page.

`sidebar/AppSidebar.tsx`, `layout/LegalLayout.tsx` and `shared/footer/Footer.tsx` are `async` server
components that call `getTranslations` from `next-intl/server`; client components use the `useTranslations`
hook. The footer's copyright is its one translated client island,
[`shared/footer/components/Copyright.tsx`](./shared/footer/components/Copyright.tsx), because its year moves from
the one the server rendered with to the visitor's after mount. The planner itself is client-side end to end. [ADR 0001](../../../../../adr/0001-planner-runs-in-the-browser.md).

## A stepped form modal

`premium/PremiumRequiredModal.tsx` and [`shared/contact/ContactModal.tsx`](./shared/contact/ContactModal.tsx)
share two pieces. [`shared/StepOutcome.tsx`](./shared/StepOutcome.tsx) holds the `Step` const
(`INPUT | SUCCESS | ERROR`) and the panel either modal renders once the form is done: it takes a `tone`
(`SUCCESS` or `ERROR`), an icon, a title, a description and an optional `onTryAgain`, whose presence decides
between one Close button and the Try-again/Close pair. [`shared/FormButtons.tsx`](./shared/FormButtons.tsx) is
the submit row. Their labels (`submit`, `processing`, `cancel`, `tryAgain`, `close`) live in the `formButtons`
namespace.

**The Premium modal's auto-close handle lives in a ref that `handleClose` and the unmount cleanup both
clear.** Once opened, the modal stays mounted for the life of the page (`useHasOpened` in
[`premium/PremiumModal.tsx`](./premium/PremiumModal.tsx)), so a timer nobody kept would close a modal reopened
before it elapsed and `form.reset()` the address being typed.
[`premium/PremiumRequiredModal.test.tsx`](./premium/PremiumRequiredModal.test.tsx) drives the steps on fake
timers and counts `onClose`. The timer and the `welcomeToPremium` countdown both read `AUTO_CLOSE_MS`.

**The Premium modal names the feature inside one message, and keeps it while it closes.**
`premiumModal.featureRequiresPremium` takes the feature's label as `{feature}` inside a `<b>`, so each bundle puts
it where its sentence wants it. `closeModal` clears the store's `currentFeature` while the dialog is still
animating out, so the modal keeps the last feature it was given in its own state; reading the prop would drop the
name from the sentence for the length of the exit animation.

**The checkout hands back exactly once, after a moment on screen or when it leaves the screen, whichever comes
first.** Once a payment succeeds, [`premium/CheckoutForm.tsx`](./premium/CheckoutForm.tsx) grants Premium and
reports `payment_completed` at once, then keeps the confirmation on screen for `HAND_BACK_DELAY_MS` before calling
`onSuccess`, which thanks the donor, resets `Donate`'s form and closes the popover. Closing the popover unmounts
the form, so the timer's handle sits in a ref the unmount cleanup reaches, and the cleanup runs the pending
hand-back at once instead of dropping it: a dropped one would leave the paid checkout in place for the next
opening. From the success on, the form disables Back and Pay and its confirmation refuses to run, the express
button's included: Back in that moment would report `payment_cancelled` for a paid Donation, and Pay would
confirm a PaymentIntent that has already succeeded.

**The checkout fetches Stripe.js when it mounts, and says so when it cannot.**
[`premium/StripeElementsProvider.tsx`](./premium/StripeElementsProvider.tsx) wraps `CheckoutForm` in Stripe's `<Elements>`
and asks `getStripeClientInstance()` for Stripe.js in an effect, so a visitor who never donates never fetches it and
importing `Donate` fetches nothing. It hands `Elements` the loaded instance and never the promise: `Elements` chains handlers onto a promise it is given,
so a rejection would escape as an uncaught one whatever the caller catches. While the script loads it draws
[`premium/StripeLoadingFixture.tsx`](./premium/StripeLoadingFixture.tsx) and mounts nothing of the checkout, so a blocked
script, which fails within milliseconds, never mounts the form it would then unmount. A visitor whose browser blocks `js.stripe.com` (a content blocker, a privacy extension, a
proxy) is an expected case, so the failed load logs nothing and tracks nothing: the checkout shows
`checkout.formUnavailable` with a Try again button that asks the client again and the same Back the checkout has, and
reopening the popover loads again too. `StripeElementsProvider.test.tsx` fails an uncaught rejection and any
`console.error` or `logClientError` on the failure.

## Skeletons and bones

Loading states go through `boneyard-js`, not hand-rolled shimmer divs. These pieces cooperate:

- `bones/*.bones.json`: captured DOM shapes, regenerated by `pnpm bones:build`. Output path and
  animation come from [boneyard.config.json](../../../boneyard.config.json), which carries no colour:
  [`BONES_COLORS`](../styles/palette.ts) hands them to `boneyard-js` from `BonesProvider.tsx`.
- [`bones/registry.ts`](./bones/registry.ts): generated, carries a "do not edit" banner. It registers every bone under a
  string name and calls `configureBoneyard`. The banner means *do not hand-author it*, not *never
  touch it*: its whole body is a pure function of the `.bones.json` files present and the config, so
  deleting a descriptor has to be paired with dropping its import and its `registerBones` entry, and
  the result is what the next `pnpm bones:build` would emit anyway. Anything that is **not** derivable
  that way belongs in `providers/BonesProvider.tsx` instead, where a rebuild will not overwrite it.
- `providers/BonesProvider.tsx`: imported by the locale layout, renders `null`. It side-effect imports
  the registry and then calls `configureBoneyard` again with `boneClass: 'boneyard-bordered'` added.
  Order matters: the registry's call runs first (imports are hoisted), so the provider's config is the
  one that wins. Change the provider, not the generated file.

The `animate: 'shimmer'` in that config names a boneyard-js animation style, not a stylesheet keyframe.
The library injects `@keyframes bs-<uid>` beside each skeleton at runtime, so no CSS under `ui/styles/`
declares, or should declare, a keyframe called `shimmer`.

**`fixture` and `fallback` are not the same thing, and passing only the first renders nothing.** `fixture`
is build-time only: the component renders `fixture ?? children` when the CLI sets `window.__BONEYARD_BUILD`,
so the capture has a shape to measure even when real data cannot be reached. At run time a `<Skeleton>` whose
bone is missing renders `fallback`, and an empty container for the whole loading window when there is none.
Every `<Skeleton>` passes both, pointing at the same fixture component:
[`pages/planner/CalendarList.tsx`](./pages/planner/CalendarList.tsx), [`pages/planner/Summary.tsx`](./pages/planner/Summary.tsx),
[`pages/planner/ManagementBar.tsx`](./pages/planner/ManagementBar.tsx) and `premium/CheckoutForm.tsx`. The
fixtures ([`pages/planner/calendar/CalendarListFixture.tsx`](./pages/planner/calendar/CalendarListFixture.tsx),
[`pages/planner/PlannerPanelFixture.tsx`](./pages/planner/PlannerPanelFixture.tsx),
[`pages/planner/summary/SummaryFixture.tsx`](./pages/planner/summary/SummaryFixture.tsx),
[`premium/ExpressCheckoutFixture.tsx`](./premium/ExpressCheckoutFixture.tsx)) are hand-written approximations
kept beside their component.

**A stale `.bones.json` re-registers itself, so closing a drift means deleting the file.** The CLI merges
what it captured with every descriptor still on disk (`mergePreservingExisting`, absent `--force`), so a
descriptor no `<Skeleton>` asks for stays registered until its file goes. The registry holds the bones
requested by name: `calendar-list`, `planner-panel` and `summary`.

`express-checkout`, which `premium/CheckoutForm.tsx` requests, has no captured descriptor, so it shows its
`fallback`. The CLI renders the `fixture`, not the real children, so capturing it needs no Stripe client
secret.

## Testing

Vitest, `happy-dom`, co-located `.test.tsx`. The exclusions in [`vitest.config.ts`](../../../vitest.config.ts) that matter here:

- `src/ui/modules/bones/**`: excluded from both the test run *and* the coverage report. It is
  generated data; asserting on it would only assert that the generator ran.
- `src/ui/modules/core/animate/icons/`: excluded from the **coverage report** only, and the glob spares
  `Icon.tsx`, whose co-located test runs with everything else.

A module with no test of its own is data (`shared/strategyIcons.ts`, `shared/cookie-consent/config/config.ts`)
or is exercised through its one caller's test (`export/exportPdf.tsx` through
`sidebar/components/CalendarExport.test.tsx`, `shared/contact/LazyContactModal.tsx` through
`shared/contact/ContactButton.test.tsx`).
[`core/primitives/utils/helpers.test.ts`](./core/primitives/utils/helpers.test.ts) holds the whole of the logic
in that folder, `hasFlag`: an empty `flag` string reads as no flag, because a Region has none and the picker
would otherwise render a blank slot.

[`shared/cookie-consent/CookieConsentDialog.test.tsx`](./shared/cookie-consent/CookieConsentDialog.test.tsx)
walks `COOKIE_SECTIONS` and asks for each switch **by name**, so a section or a service added to the config
without a label fails; [`sidebar/components/PtoDays.test.tsx`](./sidebar/components/PtoDays.test.tsx) and
[`sidebar/components/CarryOverMonths.test.tsx`](./sidebar/components/CarryOverMonths.test.tsx) assert the
name through the real widget.

**`e2e/` walks one flow here, the quick start from the homepage to `/planner`** (its steps, the Strategy, the
mobile drawer); the rest of it answers routes and HTTP contracts. Nothing there toggles a day, changes the
budget or reaches a Premium gate, so a component reached only through `e2e/` is proven to *mount inside a page
that renders*, and nothing more.

**A motion value read in the tick of the event that changed it still holds the old number, and against a
baseline of nought that passes vacuously.** `useTransform` recomputes on motion's own frame loop, so
`raw.set(1)` followed by `mapped.get()` answers whatever `mapped` held before, and subscribing to the value
does not replace the flush.
[`pages/homepage/sections/CtaShapesClient.test.tsx`](./pages/homepage/sections/CtaShapesClient.test.tsx), whose
parallax rests at nought, awaits a frame between the event and the read.

**Mock the module a component imports, not its package root.**
[`premium/CheckoutForm.test.tsx`](./premium/CheckoutForm.test.tsx) mocks `boneyard-js/react`, which is what
`CheckoutForm.tsx` imports; a mock of `boneyard-js` would leave it real. `vi.mock` resolves its path, so an
alias and a relative path to the same file are one mock.

## Gotchas

**The skip link and every landmark it can reach read one const.** `layout/SkipToContent.tsx` exports
`MAIN_CONTENT_ID` and builds its own `href` from it; each route shell interpolates the same const onto its
landmark. A shell that forgets it leaves a promise to a screen reader that never resolves: Tab then Enter does
nothing. [`layout/SkipToContent.test.tsx`](./layout/SkipToContent.test.tsx) renders each shell it can and
asserts the landmark is in the tree, and scans `src/` for the declaring files so the list cannot silently
shrink or grow a duplicate; the scan also accepts the literal `"main-content"`, which is what tells a new shell
apart from a renamed one.

**The skip link's destination shows it received focus.** `SidebarInset` carries `tabIndex={-1}` so the
fragment jump can land on it, and pairs `outline-none` with `focus-visible:ring-[3px] … ring-inset`;
`layout/SkipToContent.test.tsx` reads the `<SidebarInset` opening tag and fails on a suppression with no ring
beside it.

**`focus:outline-none` kills the focus ring too.** `:focus-visible` is a subset of `:focus`, so no
`focus-visible:ring-*` written after it brings the ring back. A panel that is only focused programmatically
(`core/animate/base/Drawer.tsx`'s content) goes without a ring because nothing tabs onto it.
`premium/PremiumFeature.tsx` (on every gated chart, Holiday row, the Custom tab and the export) and
`shared/Logo.tsx` (the first focusable element in the planner sidebar) carry the
`focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:ring-offset-2` treatment, and their tests pin
the ring.

**[`shared/footer/components/DevFooter.tsx`](./shared/footer/components/DevFooter.tsx) builds each social link's
name from its config key** with `replaceAll("_", " ")`: `replace` with a string pattern changes the first match
only, and `BUY_ME_A_COFFEE` would announce as *buy me_a_coffee*;
[`DevFooter.test.tsx`](./shared/footer/components/DevFooter.test.tsx) asks for each link **by name**.

**In `shared/donate/DonationForm.tsx`, `FormControl` sits inside `InputGroup`, around `NumberInput`**, so
the amount label's `for` and the `aria-describedby` land on the input rather than on the `role="group"`
wrapper: `NumberInput` hands the `id` to Base UI's field root and every other prop to the `<input>`. Its wrapper
`div` is `display: contents`, so the input is the group's flex item without being the group's direct
child, and `InputGroup`'s `[&>input]` padding selectors do not reach it, which is why the amount and the salary pass
`pl-2` themselves. The form sets `noValidate`, and the email and amount inputs declare `required`, which puts it in the
accessible tree without turning native validation back on. The promo-code input has a `FormLabel` of its own, since a
placeholder vanishes on the first keystroke.

**The legal identity modules derive their own accessible name; they take no prop.** `pages/legal/Me.tsx`,
`pages/legal/Nif.tsx` and `pages/legal/Address.tsx` are `{ character, order }` tables that
[`pages/legal/ScrambledText.tsx`](./pages/legal/ScrambledText.tsx) renders into flexbox-`order`-scrambled
spans, so the DOM text is nonsense and `role="img"` makes the `aria-label`, which `decodeScrambledText` builds
by sorting on `order`, the only thing announced. [`pages/legal/identity.test.tsx`](./pages/legal/identity.test.tsx) pins the
decoded strings, so a transposed `order` fails there rather than shipping a wrong NIF.

**vanilla-cookieconsent dispatches its `cc:*` events on `window`, never on `document`.** Its emitter is a
bare `dispatchEvent(new CustomEvent(...))`, which resolves to `window`, and a listener on `document` never
hears it. `tracking/BetterStackTracking.tsx` and
[`shared/cookie-consent/CookieConsent.tsx`](./shared/cookie-consent/CookieConsent.tsx) both listen on `window`,
and `BetterStackTracking.test.tsx` fails when an event dispatched on `document` mounts the snippet.

**[`shared/cookie-consent/utils/consent.ts`](./shared/cookie-consent/utils/consent.ts) answers what has been
consented to.** It holds the analytics service ids and the functions over them:
`isServiceConsented`, `consentedAnalyticsServices`, `allAnalyticsServices`. `CookieConsent.tsx` and
`tracking/BetterStackTracking.tsx` both read `acceptedService` through it.

**The library keeps `acceptedCategory('analytics')` true while *any* service in the category is on.** The
preferences dialog offers `ga4` and `betterStack` as separate switches, so a gate that asked the category
would grant Google Analytics to a visitor who refused it; the services are declared in
[`config/config.ts`](./shared/cookie-consent/config/config.ts).

**Consent is *answered* one way and *notified* another, and that is structural rather than drift.**
`CookieConsent.tsx` owns the config it hands to `CookieConsentLib.run`, so it reacts through that config's
`onConsent`/`onChange` callbacks. `tracking/BetterStackTracking.tsx` cannot add a callback to someone else's
config, so it listens for the `cc:onConsent`/`cc:onChange` window events the library dispatches. Collapsing
them would move `updateGtagConsent` out of the callback that fires synchronously with the decision, a timing
no unit test can vouch for.

**The consent banner and the preferences dialog never render together.** `CookieConsent`'s
`if (showBanner) return …` comes first, so every path that opens the preferences clears the banner: the
banner's own "Manage preferences" button and the `cc:showPreferences` handler the footer's `CookieButton`
reaches.

**`sidebar/components/PtoCalculator.tsx` keeps the total and the inputs it came from in one state object.**
React bails out of an equal update, so a ref read during render would leave the caption describing the
previous inputs when a second Calculate lands on the same total; `PtoCalculator.test.tsx` pins the redraw.

**`sidebar/components/WorkdayCounter.tsx` narrows the range picker's value with
[`isFromToObject`](./pages/planner/calendar/utils/helpers.ts)**, which checks that both ends are `Date`s. A
range picker emits `{ from, to: undefined }` mid-selection, and `"to" in date` is true for it: an `in` check
tests for a **key**, not a value. `Calendar` holds its own `rangeSelection` while a range is being picked, so
ignoring the half value loses nothing.

[`core/animate/primitives/`](./core/animate/primitives) is a second, lower layer under `core/animate/`: the unstyled wrappers over
`@base-ui/react` that [`core/animate/base/`](./core/animate/base) builds on. [`MotionSlot.tsx`](./core/animate/primitives/animate/MotionSlot.tsx) there is the shared `asChild`
mechanism used by [`core/animate/effects/AutoHeight.tsx`](./core/animate/effects/AutoHeight.tsx) and [`core/animate/icons/Icon.tsx`](./core/animate/icons/Icon.tsx).

**`tutorial/DriverStyles.tsx` exists for its import, not its render.** It imports the driver.js stylesheet,
and [`useTutorial.tsx`](../hooks/useTutorial.tsx) dynamic-imports the module alongside the driver client, so the
stylesheet loads with the tour and never in the initial bundle. Nothing renders the `null` component it
exports; deleting the "empty" module silently ships the CSS eagerly.

`export/HolidayDocument.tsx` is JSX but not DOM. Its elements come from `@react-pdf/renderer` and its
styles are `StyleSheet.create` objects, so Tailwind classes and `cn()` do nothing there. It is loaded
through a dynamic import inside the Effect program in [`export/exportPdf.tsx`](./export/exportPdf.tsx), which
[`sidebar/components/CalendarExport.tsx`](./sidebar/components/CalendarExport.tsx) itself imports only when the button is pressed; importing
either statically would pull the PDF renderer, or the Effect runtime, into the planner's first load.

**`data-tutorial` attributes in `sidebar/` and [`pages/planner/`](./pages/planner) are the tour's anchors**, named
on both sides through `TUTORIAL_ANCHOR` in [`tutorial/anchors.ts`](./tutorial/anchors.ts). They look like dead
attributes and are not: a step whose anchor is not rendered lands on driver.js's dummy-element fallback with
nothing highlighted and no error. [`tutorial/anchors.test.ts`](./tutorial/anchors.test.ts) reads the component
tree and fails on an anchor the const declares that no component renders, and on one rendered that the const
does not declare.

`resolveApiErrorMessage` in `shared/utils/helpers.ts` tells a machine code from prose by shape. A
failure payload from this app carries a code (an `ApiError` value, or a Zod code such as
`email_required`), while the Stripe paths hand back a sentence Stripe has already localised, and
nothing on the wire says which one arrived. The `MACHINE_CODE` pattern is that test: snake_case with no
whitespace. An unrecognised code falls back to the generic message; prose is shown as it came. The
`as never` on the lookup key is next-intl narrowing its keys to the literals present in the bundle:
this key is only known at runtime, which is the question `has` exists to answer.

`premium/CheckoutForm.tsx` shows the user `resolveApiErrorMessage(...)` and passes the raw `result.error` to
`track`.

**`PremiumFeature` takes a `PremiumFeatureId`.** The id is declared beside the state it sets in
[`../../application/stores/premium.ts`](../../application/stores/premium.ts): the gate hands it to
`showPremiumModal`, which reports `upgrade_modal_opened` with it and the gate's `origin` (`planner` by default,
`quick_start` from the homepage dialog), and `premium/featureLabels.ts` maps each id to the message key that
holds its label.
[`premium/PremiumFeature.test.tsx`](./premium/PremiumFeature.test.tsx) clicks the gate in en and in de and
asserts the store receives the same value both times.

The label map is the one place where an id and a message path meet, and it resolves through a
**namespace-less** `useTranslations()` because the labels live in different namespaces.
`satisfies Record<PremiumFeatureId, string>` is what makes a new id a compile error rather than a blank
banner.

**`upgrade_modal_opened` is the one identifier that keeps the word `CONTEXT.md` retires for Premium**, because
it is a key in a Better Stack funnel this repository cannot see. It is declared in
[`../../infrastructure/clients/logging/better-stack/tracking.ts`](../../infrastructure/clients/logging/better-stack/tracking.ts)'s event union.

The Stripe Elements appearance lives in [`shared/donate/stripeAppearance.ts`](./shared/donate/stripeAppearance.ts), and it draws with the theme as hex
values. The Elements iframe cannot read this app's CSS custom properties, so the light and dark palettes in
[`src/ui/styles/palette.ts`](../styles/palette.ts) mirror `--surface-panel`, `--surface-panel-alt`, `--sidebar`,
`--foreground`, `--frame`, `--primary-foreground`, `--accent`, `--destructive`, `--muted-foreground` and `--ring` from
[`src/ui/styles/global/index.css`](../styles/global/index.css) by value, and the shadow offsets mirror the
`--shadow-brutal-*` scale. Change a token there and `palette.test.ts` fails until the palette follows, so the donation
form does not drift from the page around it; the shadow offsets are the part no test holds.

**What the Elements iframe cannot load, it gets from a copy.** It cannot load `next/font`'s files, whose
names carry a per-build hash, so the faces it types in come from
[`public/fonts/stripe/fonts.css`](../../../public/fonts/stripe/fonts.css), which declares Space Grotesk and
JetBrains Mono over woff2 files beside it; `stripeFonts` hands its absolute URL to Elements as `cssSrc`. That
copy does not follow a font upgrade in `app/fonts.ts`; refresh the files by hand when the faces change. The
iframe fetches them from Stripe's origin, which is why `public/_headers` gives that folder
`Access-Control-Allow-Origin`. `CheckoutForm.tsx` pins the Payment Element to `layout: 'accordion'`, because
the two layouts share the `.TabIcon--selected` rule: an ink selected tab wants a light icon, a cream accordion
card a dark one, and the rule and `colorIconTabSelected` are the frame colour the accordion needs. The input
text is 16px on phones, read from `useIsMobile`, because the browser zooms into anything smaller.

**[`sidebar/components/SidebarFieldLabel.tsx`](./sidebar/components/SidebarFieldLabel.tsx) is how a sidebar control is
labelled.** `SidebarFieldLabel` (icon, title, optional tooltip, optional `controlId`) renders a `<label for>`
when handed a `controlId` and a `div` heading otherwise; `SidebarFieldTooltip` is the tooltip block alone,
which `PtoCalculator.tsx`, `PtoSalaryCalculator.tsx` and `CalendarExport.tsx` use without a label. The
combobox triggers of Country, Region and Strategy and the `Years` trigger are labelable, but `Counter` in
[`PtoDays.tsx`](./sidebar/components/PtoDays.tsx) and `Slider` in
[`CarryOverMonths.tsx`](./sidebar/components/CarryOverMonths.tsx) render a `div` root, so those fields render a
heading and the widget names itself (see [`core/AGENTS.md`](./core/AGENTS.md)); `PtoDays.test.tsx`,
`CarryOverMonths.test.tsx` and `AllowPastDays.test.tsx` fail on a `<label>`.

The per-caller differences go through `className`: the tooltip width (`w-50` for the fields, `w-60` for the
calculators and the Workday counter), `Strategy`'s `font-medium` with no vertical margin and the counter's
`my-0`.

**`useFormStatus` reports nothing in this app.** React reports `pending` only for a parent `<form>` submitted
through a form **action**, and every form here submits through `onSubmit`. So `shared/FormButtons.tsx` takes
`pending` as a **required** `boolean`, fed by the caller's transition or loading flag, and in
`shared/donate/DonationForm.tsx` every control a submission reads, the address the receipt goes to included,
disables on that same flag.

**One module owns the locale switch.** `hooks/useLanguageSwitch.ts` holds the policy;
`sidebar/components/LanguageSelector.tsx` and `shared/HomepageLanguageSwitcher.tsx` keep only
their triggers, which genuinely differ (the sidebar's collapses to a code and wraps in `AnimateIcon`).
`usePathname` from `@application/i18n/navigation` returns the pathname already unprefixed, so
`push(pathname, { locale })` is the whole switch; rewriting the prefix by hand would turn a locale-looking
segment such as `/es-guide` into `/en-guide`, which the hook's test pins.

**`pages/homepage/sections/Testimonials.tsx` pairs each style with a slot, not with a person.**
`CARD_STYLES[idx]` gives the avatar colour and the tilt by position in `TESTIMONIAL_KEYS`, which renders in
order, so reordering the keys repaints the cards.

`BRIDGE_WEEK` in [`pages/homepage/sections/Features.tsx`](./pages/homepage/sections/Features.tsx) is the shape the card's copy describes:
Workdays Monday to Wednesday, a Thursday Holiday, a Friday PTO Day, then the weekend: a Bridge.
Reordering the array desyncs the illustration from the translated text beside it.

**One Country count is written three times.** `Features.tsx` passes `count: 203` and prints six flags and
`+197`, and `Stats.tsx` prints `format.number(203)`; nothing ties the three literals together, so change them
as one.

**[`pages/homepage/sections/shared.ts`](./pages/homepage/sections/shared.ts) is read by the docs site.**
`homepage.mdx` and `HomepagePatternsDemo.tsx` import its exports, and the docs Tailwind build scans its class
strings through `@source`, so renaming an export or a class there is a change to `apps/docs`.

**[`sidebar/AppSidebar.tsx`](./sidebar/AppSidebar.tsx) mounts no `SidebarProvider` and must not grow one.** It returns a
fragment of `Sidebar` plus `SidebarInset` and reads the context from `app/[locale]/(app)/planner/layout.tsx`,
the app's only mount site; a second provider would give the tree a second, independent `open`/`openMobile`
pair. `Sidebar.test.tsx` fails on a second mount anywhere under `src/`. A host other than that layout has to
supply the provider.

**[`sidebar/components/SidebarCollapsibleGroup.tsx`](./sidebar/components/SidebarCollapsibleGroup.tsx) takes the pieces of
its trigger, not the trigger.** `AppSidebar` is a server component and hands the group an `icon`, a `label` and a
`tooltip`; the group draws the `SidebarMenuButton`, its chevron and the `CollapsibleTrigger` itself, in the client module
that owns the `Collapsible`. An element a server component builds and passes down can arrive as a lazy reference, which
`CollapsibleTrigger asChild` does not clone (the core guide has the mechanism), so a `trigger` prop would draw a second
`<button>` around the menu button on some first passes.

**[`shared/donate/Donate.tsx`](./shared/donate/Donate.tsx)'s trigger is a `fixed` band, and the band is `pointer-events-none` while the
button inside it is `pointer-events-auto`.** Below `md` the container is `w-full` and the `Button` inside
carries `w-full` too, so the edges coincide and the band is the button; that is the full-bleed mobile
CTA and deleting the `w-full` would shrink it to its text. What the guards buy is the gap the container can
open without anyone editing it: `donate-brutal`'s `nudge` keyframes translate the button up to 3px sideways
for the last 12% of every four-second cycle, and `md:w-auto` reverses the coincidence outright the moment a
caller passes a narrower child. A `fixed` element at `z-50` spanning the viewport is worth making inert by
construction rather than by measurement.

**`Donate` takes its bottom offset from its caller and holds none of its own.** `bottomClassName` is required:
the marketing page passes `bottom-3 md:bottom-4`, and the planner layout passes `bottom-[calc(15dvh+8px)] md:bottom-4`,
the mobile drawer's collapsed snap point (`DRAWER_SNAP.COLLAPSED`, `0.15`, in
[`pages/planner/ManagementBar.tsx`](./pages/planner/ManagementBar.tsx)) written out as a class, since Tailwind
reads literals only. The planner layout's test fails when the two drift apart.

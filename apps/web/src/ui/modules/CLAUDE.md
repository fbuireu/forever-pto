# apps/web/src/ui/modules

Every React component the product renders. Nothing else in `src/ui/` holds components: `hooks/`,
`utils/`, `adapters/`, `styles/`, `assets/` and `i18n/` are support code, and the route files under
`src/app/` are thin: they compose modules and pass `locale` down.

## Layout

| Folder | Holds | Reused across screens? |
| --- | --- | --- |
| `core/` | The design system: `primitives/` plus the `animate/` layer. See [core/CLAUDE.md](./core/CLAUDE.md) | Yes, everywhere |
| `pages/` | One folder per screen: `homepage/`, `planner/`, `legal/`, `error/`, `not-found/`. See [pages/planner/CLAUDE.md](./pages/planner/CLAUDE.md) | No, by definition |
| `shared/` | Cross-page pieces that are not primitives: footer, donate, contact, cookie consent, JSON-LD, [`shared/Logo.tsx`](./shared/Logo.tsx), [`shared/Icon.tsx`](./shared/Icon.tsx), [`shared/FormButtons.tsx`](./shared/FormButtons.tsx), [`shared/StepOutcome.tsx`](./shared/StepOutcome.tsx), [`shared/SupportButton.tsx`](./shared/SupportButton.tsx), [`shared/ConditionalWrapper.tsx`](./shared/ConditionalWrapper.tsx), [`shared/WebMCP.tsx`](./shared/WebMCP.tsx), plus [`shared/utils/helpers.ts`](./shared/utils/helpers.ts) for the helpers those pieces need | Yes |
| `layout/` | [`layout/LegalLayout.tsx`](./layout/LegalLayout.tsx), the card chrome the four legal pages share, and [`layout/SkipToContent.tsx`](./layout/SkipToContent.tsx), which owns the skip link **and** the `MAIN_CONTENT_ID` every route shell's landmark is keyed on | Between sibling routes |
| `sidebar/` | [`sidebar/AppSidebar.tsx`](./sidebar/AppSidebar.tsx) and its controls: country, region, year, Strategy, PTO Day budget, the calculators, calendar export | One screen, but not a page section |
| `premium/` | The Premium gate and the Donation checkout: [`premium/PremiumFeature.tsx`](./premium/PremiumFeature.tsx), [`premium/featureLabels.ts`](./premium/featureLabels.ts), [`premium/PremiumModal.tsx`](./premium/PremiumModal.tsx), [`premium/PremiumRequiredModal.tsx`](./premium/PremiumRequiredModal.tsx), [`premium/CheckoutForm.tsx`](./premium/CheckoutForm.tsx) | Yes |
| `providers/` | Context wrappers mounted once in the locale layout: [`providers/AppThemeProvider.tsx`](./providers/AppThemeProvider.tsx), [`providers/BonesProvider.tsx`](./providers/BonesProvider.tsx) | Once |
| `stores/` | [`stores/StoresInitializer.tsx`](./stores/StoresInitializer.tsx), a render-nothing component that seeds the filters store from the `user-country` cookie | Once |
| `tutorial/` | [`tutorial/DriverStyles.tsx`](./tutorial/DriverStyles.tsx) only, a render-nothing component whose single job is to make the driver.js stylesheet import lazy | Once |
| `tracking/` | The third-party script mounts: [`tracking/Analytics.tsx`](./tracking/Analytics.tsx) (Google gtag consent defaults and config) and [`tracking/BetterStackTracking.tsx`](./tracking/BetterStackTracking.tsx) (the Better Stack snippet, gated on the cookieconsent `betterStack` **service**, not the category) | Once |
| `export/` | [`export/HolidayDocument.tsx`](./export/HolidayDocument.tsx), the `@react-pdf/renderer` document tree. Not DOM React; it renders in the PDF reconciler only | Once |
| `bones/` | Generated skeleton data, see below. Not hand-written | n/a |

`core/` is the only folder allowed to be imported by everything else. It is also the only folder that
must not import anything back: no stores, no `useTranslations`, no data fetching.

## Where a new component goes

Walk the questions in order and stop at the first yes.

1. Is it a stateless visual element with no product vocabulary in it: a button, a field, a badge, an
   animated icon? → `core/`. It takes strings as props; it never calls `useTranslations`.
2. Does it exist because one screen needs it? → `pages/<screen>/`. Split further into a subfolder once
   the screen folder passes roughly a dozen files, as `planner/` has.
3. Is it mounted by more than one screen and does it carry product meaning? → `shared/`.
4. Does it gate something behind Premium, or move money? → `premium/`, whatever screen uses it. Access
   is derived from the payment record, not stored as a flag. [ADR 0008](../../../../../adr/0008-premium-derived-from-payment.md).
5. Is it a context provider, or a component whose whole job is a side effect and whose render is
   `null`? → `providers/`, `stores/`, `tracking/` or `tutorial/` depending on what the effect is: a
   context wrapper, seeding a store, mounting a consent-gated third-party script, or loading the
   tutorial's lazy stylesheet.

The awkward case is a `shared/` component that needs a helper living under `pages/`. That import points
the dependency the wrong way, so the helper moves up to `shared/utils/helpers.ts` instead, which is what
`getViewBoxFromSvg` did once `shared/Icon.tsx` became its only caller. The same rule settles a component
one screen keeps in its own folder while a second screen renders it: it moves to `shared/`, not sideways
into the other screen.

## Conventions

**No barrel files.** There is not a single `index.ts` anywhere in `src/`. Import the module directly.

**Named exports only.** `default` appears only inside `dynamic()` calls, where Next.js requires it;
hence the `.then((m) => ({ default: m.X }))` dance you will see repeatedly.

**Tests sit next to the component** as `*.test.tsx`, never in a `__tests__/` folder. So do
co-located stylesheets: [`pages/planner/legend.module.css`](./pages/planner/legend.module.css), [`pages/planner/contact.css`](./pages/planner/contact.css) and
[`shared/donate/donate.css`](./shared/donate/donate.css) live beside the component that imports them. Only cross-cutting CSS belongs
in `src/ui/styles/`.

**`*Client.tsx` means two different things.** The suffix is not a single convention, and reading it as
one will mislead you:

- A thin `'use client'` shell that `dynamic()`-imports the real component with `ssr: false`, purely to
  keep a heavy dependency out of the server bundle: [`shared/donate/DonateClient.tsx`](./shared/donate/DonateClient.tsx),
  [`shared/cookie-consent/CookieConsentClient.tsx`](./shared/cookie-consent/CookieConsentClient.tsx). The shell takes the same props and forwards them.
- The interactive half of a server/client pair, where the server sibling does the fetching:
  [`sidebar/components/Countries.tsx`](./sidebar/components/Countries.tsx) awaits `getCountries` and hands the result to
  [`sidebar/components/CountriesClient.tsx`](./sidebar/components/CountriesClient.tsx). [`pages/homepage/sections/HomepageCta.tsx`](./pages/homepage/sections/HomepageCta.tsx) and
  [`pages/homepage/sections/CtaShapesClient.tsx`](./pages/homepage/sections/CtaShapesClient.tsx) are the same pair for translated strings.

Whichever it is, the export carries the file's name. Without barrel files every import site has to spell
the module path anyway, so a file whose export is named something else just makes it unfindable.

**`*Fixture.tsx` is a static placeholder**, not a test fixture. See the skeleton section.

**Server by default.** A file gets `'use client'` only when it needs state, an effect, a store or a
browser API. `sidebar/AppSidebar.tsx` and `layout/LegalLayout.tsx` are `async` server components that
call `getTranslations` from `next-intl/server`; client components use the `useTranslations` hook. The
planner itself is client-side end to end. [ADR 0001](../../../../../adr/0001-planner-runs-in-the-browser.md).

## A three-step form modal

`shared/StepOutcome.tsx` holds what `premium/PremiumRequiredModal.tsx` and
[`shared/contact/ContactModal.tsx`](./shared/contact/ContactModal.tsx) were writing out twice: the `Step`
(`INPUT | SUCCESS | ERROR`) const both declared identically, and the success and
error panels they both render once the form is done.

The panels had **drifted visually**, not just structurally. `ContactModal` used the
neo-brutalist treatment (a 64px tile with a 3px frame and hard shadow, and an
uppercase mono badge over the description), while the Premium modal rendered a plain
centred icon and heading. They are both brutalist now; `StepOutcome` takes a `tone`
(`SUCCESS` or `ERROR`), an icon, a title, a description, and an `onTryAgain` whose
presence is what decides between one Close button and the Try-again/Close pair.

Three other things the two disagreed about are gone with it:

- **The Premium modal hand-wrote the submit row**, including a verbatim copy of
  `FormButtons`' own `<Loader2 className='size-4 mr-2 animate-spin' />`, while
  `FormButtons` exists for exactly that. It uses it now.
- **It reported one failure twice**: `form.setError('email', …)` *and* the ERROR
  panel, with two near-identical strings. The field error was invisible anyway,
  because the ERROR step unmounts the form that would render it. Only the panel
  remains.
- **`setTimeout(handleClose, 5000)` sat beside `t('welcomeToPremium', { seconds: 5 })`**
  with nothing tying the two numbers together. Both read `AUTO_CLOSE_MS` now.

`tryAgain` and `close` moved from the `contact` and Premium modal namespaces into
`formButtons`, where `submit`, `processing` and `cancel` already live. They were
character-identical in all six locales, so that is twelve translations recovered and
one place left to edit.

**Its auto-close is held in a ref and cleared twice, and it used to be held nowhere.** The modal is mounted
for the life of the planner by [`app/[locale]/(app)/planner/layout.tsx`](../../app/[locale]/(app)/planner/layout.tsx),
so a `setTimeout(handleClose, AUTO_CLOSE_MS)` nobody kept a handle to outlived the panel that scheduled it:
close the success panel, reopen the modal within five seconds, and the orphaned timer shut it again and
`form.reset()` wiped the address that had just been typed. `handleClose` and an unmount cleanup both call
`cancelAutoClose` now. [`premium/PremiumRequiredModal.test.tsx`](./premium/PremiumRequiredModal.test.tsx)
drives the three steps on fake timers and counts `onClose`, which is what goes red if the handle is dropped
again.

## Skeletons and bones

Loading states go through `boneyard-js`, not hand-rolled shimmer divs. Three pieces cooperate:

- `bones/*.bones.json`: captured DOM shapes, regenerated by `pnpm bones:build`. Output path and
  colours come from [boneyard.config.json](../../../boneyard.config.json).
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

**`fixture` and `fallback` are not two names for the same thing, and passing only the first renders
nothing.** `Skeleton` computes `showFallback = loading && !activeBones` and then renders
`showFallback ? fallback : children`; `fixture` appears nowhere in that path. It is build-time only:
the component returns early and renders `fixture ?? children` when the CLI sets
`window.__BONEYARD_BUILD`, so the capture has a shape to measure even when real data cannot be
reached. So a `<Skeleton>` whose bone is missing and which passes no `fallback` renders an empty
container for the whole loading window. Pass **both**, pointing at the same fixture component, which is
what [`pages/planner/CalendarList.tsx`](./pages/planner/CalendarList.tsx) and [`pages/planner/Summary.tsx`](./pages/planner/Summary.tsx) already did and what
[`ManagementBar.tsx`](./pages/planner/ManagementBar.tsx) and `premium/CheckoutForm.tsx` now do. The fixtures
([`pages/planner/calendar/CalendarListFixture.tsx`](./pages/planner/calendar/CalendarListFixture.tsx), [`pages/planner/PlannerPanelFixture.tsx`](./pages/planner/PlannerPanelFixture.tsx),
[`pages/planner/summary/SummaryFixture.tsx`](./pages/planner/summary/SummaryFixture.tsx), [`premium/ExpressCheckoutFixture.tsx`](./premium/ExpressCheckoutFixture.tsx)) are hand-written
approximations kept beside their component.

**A stale `.bones.json` re-registers itself, so closing a drift means deleting the file.** The CLI
merges what it captured this run with every descriptor still on disk (`mergePreservingExisting`, absent
`--force`), which is how `alternatives-manager` and `pto-status` stayed in the registry long after the
last `<Skeleton>` asking for them was removed: two 35-byte empty descriptors, registered because they
existed rather than because anything wanted them. Both files are gone and the registry is down to the
three bones actually requested by name: `calendar-list`, `planner-panel` and `summary`.

`express-checkout` in `premium/CheckoutForm.tsx` is still requested and still uncaptured, and that is
now a cosmetic gap rather than a blank box, because it has a `fallback`. Capturing it does **not**
require reaching a live Stripe client secret, contrary to what closing this looked like from the
outside: the CLI renders the `fixture`, not the real children, so `ExpressCheckoutFixture` is what a
build would measure.

## Testing

Vitest, `happy-dom`, co-located `.test.tsx`. Two exclusions in [`vitest.config.ts`](../../../../../vitest.config.ts) matter here:

- `src/ui/modules/bones/**`: excluded from both the test run *and* the coverage report. It is
  generated data; asserting on it would only assert that the generator ran.
- `src/ui/modules/core/animate/icons/`: excluded from the **coverage report** only, and the glob spares
  `Icon.tsx`, whose co-located test runs with everything else.

Coverage is deliberately uneven and you should not read a missing test as an oversight to fix in
passing. [`core/animate/`](./core/animate) is tested close to exhaustively; [`core/primitives/`](./core/primitives) has no tests at all;
`pages/`, `shared/` and `sidebar/` have tests only where logic lives (`ManagementBar`, `Summary` charts,
homepage sections, `shared/utils/helpers.ts`, the two forms that render an API failure, and, because both
held a defect that no type or lint rule can catch, [`sidebar/components/PtoCalculator.tsx`](./sidebar/components/PtoCalculator.tsx) and
[`PtoSalaryCalculator.tsx`](./sidebar/components/PtoSalaryCalculator.tsx), whose cases drive the real inputs and assert on what the field and the caption
actually show). Components whose body is markup plus translation calls are left to the Playwright suite in
`e2e/` instead.

**An accessible name is behaviour, so the components that grew one grew a test with it.**
[`shared/cookie-consent/CookieConsentDialog.test.tsx`](./shared/cookie-consent/CookieConsentDialog.test.tsx)
walks `COOKIE_SECTIONS` and asks for each switch **by name**, so a section or a service added to the config
without a label fails rather than shipping a nameless toggle;
[`sidebar/components/PtoDays.test.tsx`](./sidebar/components/PtoDays.test.tsx) and
[`sidebar/components/CarryOverMonths.test.tsx`](./sidebar/components/CarryOverMonths.test.tsx) assert the
name through the real widget rather than beside a synthetic `<input>`, which is what
`SidebarFieldLabel.test.tsx` used to do and what let a label naming a `div` pass.
[`shared/ConditionalWrapper.test.tsx`](./shared/ConditionalWrapper.test.tsx) and
[`pages/homepage/sections/Testimonials.test.tsx`](./pages/homepage/sections/Testimonials.test.tsx) are the
other two additions.

**Be precise about what that buys, because it is less than "covered".** The `e2e/` specs are smoke tests: a
page answers 200, has a non-empty `<title>`, carries the right `lang`, and a handful of section ids and links
are visible. Nothing there drives the planner (no budget change, no calculation, no day toggled, no Premium
gate), so a component reached only through `e2e/` is proven to *mount inside a page that renders*, and
nothing more. Reading "covered by e2e" as "its behaviour is asserted somewhere" is how a defect in an
untested component survives a green suite. If a component has behaviour, it needs a co-located test.

When a component is mocked in a sibling's test, mock the module path it actually imports:
[`premium/CheckoutForm.test.tsx`](./premium/CheckoutForm.test.tsx) mocks both `boneyard-js/react` and `./ExpressCheckoutFixture`, because
leaving either real drags the Stripe element tree into the test.

## Gotchas

**The skip link and every landmark it can reach read one const.** `layout/SkipToContent.tsx` exports
`MAIN_CONTENT_ID` and builds its own `href` from it; the six route shells interpolate the same const onto
their landmark. It was a string literal on both sides, and four shells did not hold up their end:
`pages/error/ErrorContent.tsx` rendered a `<main>` with no `id` (reached from `[locale]/error.tsx`,
`[locale]/(marketing)/error.tsx` and `global-error.tsx`, the first two inside the layout that emits the link)
and `app/[locale]/(app)/payment/confirmation/page.tsx` opened all three of its branches with a bare
`<div>` and had **no `main` landmark at all**. Pressing Tab then Enter did nothing on any of them, which is
the same class as the `htmlFor='remaining-days'` and `AllowPastDays` defects below: a promise to a screen
reader that never resolves. [`layout/SkipToContent.test.tsx`](./layout/SkipToContent.test.tsx) renders each
shell it can and asserts the landmark is in the tree, and scans `src/` for the declaring files so the list
cannot silently shrink or grow a duplicate. All six shells read the const; the scan still accepts the literal
form, because it is what tells a new shell apart from a renamed one.

**The destination has to show it received focus, and for a while it showed nothing.** `SidebarInset` is the
skip link's target and carries `tabIndex={-1}` so the fragment jump can land on it; it also carried a bare
`outline-none`, so taking the link moved focus and changed nothing on screen. Every keyboard user's
confirmation that the skip link worked was that the next Tab landed somewhere new. It pairs the suppression
with `focus-visible:ring-[3px] … ring-inset` now, which is the same pairing every primitive in `core/` uses;
`layout/SkipToContent.test.tsx` reads the `<SidebarInset` opening tag and fails on a suppression with no ring
beside it.

**`focus:outline-none` is always wrong, and `outline-none` on its own is the house style.** `:focus-visible`
is a subset of `:focus`, so scoping the suppression to `:focus` kills the focus-visible ring as well, and no
`focus-visible:ring-*` written afterwards can bring it back. `premium/PremiumFeature.tsx` had it, and that
gate is rendered at thirteen call sites (every gated chart, every gated Holiday row, the Custom tab, the
calendar export), so a free user tabbing through the Summary landed on a blurred chart thirteen times with
nothing on screen changing. `shared/Logo.tsx` had the unconditional form with no ring, and it is the **first**
focusable element in the planner sidebar, so it was the first thing a keyboard user met after the skip link.
Both pair `outline-none` with the `focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:ring-offset-2`
treatment now. A panel that is only focused programmatically (`core/animate/base/Drawer.tsx`'s content) is the
one place a bare suppression is fine, because nothing tabs onto it.

**Two of `shared/donate/DonationForm.tsx`'s controls said nothing about what they were about to charge.**
The three amount presets were `variant={currentAmount === preset ? "default" : "outline"}` and no
`aria-pressed`, so a reader heard the same string before and after pressing the button that *decides how much
money is taken*; `sidebar/components/CalendarExport.tsx`'s two include-toggles had the same shape over the
contents of a downloaded file. Both carry `aria-pressed` now. A `variant=` that flips on state is the tell:
if the colour means "on", something has to say so.

**The promo-code field had no label at all, and the amount field's label named a `<div>`.** The promo input
had only a `placeholder`, which vanishes on the first keystroke, so a payer correcting a half-typed code heard
"edit, FOREV" and had no click target; it takes a `FormLabel` and a new `donationForm.promoCode` key in all
six bundles. The amount field had a `FormLabel`, but `FormControl` wrapped the whole `InputGroup`, so its `id`
and `aria-describedby` landed on the `role="group"` wrapper and the `<label for>` pointed at a `div`.
`FormControl` sits **inside** `InputGroup`, around `InputGroupInput`, now. `InputGroup`'s `has-[>input]`
selectors still hold: `Slot` renders its child directly, so the DOM stays `div > input`. The form also sets
`noValidate` and carried no `required` anywhere, though the Zod schema refuses both email and amount; both
inputs declare it now, which is what puts `required` in the accessible tree without turning native validation
back on.

**The three legal identity modules derive their own accessible name; they do not take one.**
`pages/legal/Me.tsx`, `pages/legal/Nif.tsx` and `pages/legal/Address.tsx` are a `{ character, order }` table
rendered into flexbox-`order`-scrambled spans, so the DOM text is nonsense and `role="img"` makes the
`aria-label` the *only* thing announced. The prop was called `ariaLabel` and four of the five call sites
passed the field **label**; a screen reader on the legal notice heard "NIF: NIF:" and never the number, and
the same on the address and the owner's name on the privacy policy. Both pages exist to state that identity.
[`pages/legal/ScrambledText.tsx`](./pages/legal/ScrambledText.tsx) now holds the single render and
`decodeScrambledText`, which sorts the table by `order`; each module is its data plus a one-line render and
there is no prop to get wrong. [`pages/legal/identity.test.tsx`](./pages/legal/identity.test.tsx) pins the
three decoded strings, so a transposed `order` on a compliance page fails red instead of shipping a wrong
NIF. `legalNotice.…items.owner.value` and `privacyPolicy.…dataController.items.name.value` were `"{author}"`
in all six bundles with no caller and no `author` source; those twelve entries are deleted.

**vanilla-cookieconsent dispatches its `cc:*` events on `window`, never on `document`.** Its emitter is a
bare `dispatchEvent(new CustomEvent(...))`, which resolves to `window`, and an event dispatched on `window`
does not reach a listener on `document`. `tracking/BetterStackTracking.tsx` listened on `document`, so its
`cc:onConsent`/`cc:onChange` handlers never fired and the snippet was never injected: `window.betterstack`
stayed undefined and every `track()` and `identifyUser()` call no-opped for **every** consenting visitor.
[`shared/cookie-consent/CookieConsent.tsx`](./shared/cookie-consent/CookieConsent.tsx) already used `window` for `cc:showPreferences`; the two now agree.

**One module answers what has been consented to, and every reader uses it.**
[`shared/cookie-consent/utils/consent.ts`](./shared/cookie-consent/utils/consent.ts) holds the analytics service ids and three functions over them:
`isServiceConsented`, `consentedAnalyticsServices`, `allAnalyticsServices`. `CookieConsent.tsx` derived that
state inline at three separate call sites (the initial read, `onConsent` and `onChange`), and
`tracking/BetterStackTracking.tsx` answered the same question through a different library call. Two
mechanisms for one question is exactly how the category-versus-service bug below shipped; both now read
`acceptedService`, through this module.

**`utils/consent.ts` has a test now, and it reproduces the defect below.** The trio had none, against three
shipped defects on record. Its cases pin the thing that went wrong: `isServiceConsented` is called with the
*service* id and the category, `consentedAnalyticsServices` reports one service off while the other is on
(which asking the category could not), and it covers every id the dialog config declares, so a gate can never
read `undefined` for one. Swapping the service id for the category turns two of the five red.

**Consent is *answered* one way and *notified* two, and that second part is structural rather than drift.**
`CookieConsent.tsx` owns the config it hands to `CookieConsentLib.run`, so it reacts through that config's
`onConsent`/`onChange` callbacks. `tracking/BetterStackTracking.tsx` is a separate component and cannot add a
callback to someone else's config, so it listens for the `cc:onConsent`/`cc:onChange` window events the
library dispatches. Collapsing the two would mean making `CookieConsent` listen for its own library's events
instead of using the callbacks it already registers: plausible, but the callbacks fire synchronously with the
decision and `updateGtagConsent` runs inside one, so the timing is not something a unit test can vouch for.
Left as is, deliberately, and written down so it does not read as an oversight.

**Consent is collected per service, so it has to be *read* per service.** The preferences dialog offers
`ga4` and `betterStack` as separate switches, but both gates asked `acceptedCategory('analytics')`, which the
library keeps true while *any* service in the category is on. Turning Google Analytics off and leaving Better
Stack on therefore granted `analytics_storage` and fired a `page_view`: Google Analytics writing `_ga` for a
user who had just refused it, and the mirror case mounting Better Stack for someone who had refused *that*.
Both now read `acceptedService(id, 'analytics')`. A new service in [`config/config.ts`](./shared/cookie-consent/config/config.ts) needs its own gate; the
category is not a proxy for it.

**The footer's "Manage cookies" was dead while the first-visit banner was up.** `CookieButton` dispatches
`cc:showPreferences`, and `CookieConsent`'s handler set `showPreferences` without clearing `showBanner`; the
`if (showBanner) return …banner…` early return then short-circuited before the dialog could render, so the
click did nothing at all. The handler now clears the banner first, which is exactly what the banner's own
"Manage preferences" button already did; the two entry points had silently disagreed.

**Anything the render reads has to be state, not a ref: React bails out of equal updates.**
`sidebar/components/PtoCalculator.tsx` kept the inputs behind the accrual result in a
`calculationSnapshotRef` written by the Calculate handler and read during render. The only re-render on that
path was `setCalculatedDays`, so a second Calculate landing on the *same* total scheduled no render at all
and the caption went on describing the previous inputs: 2 days/month × 6 months, then 1 × 12, both totalling
12, and the caption still read "2 × 6". Total and snapshot are now one state object, so a fresh identity
makes `Object.is` fail and the render happens. A ref is for values the render does not read.

**An input whose state starts `undefined` mounts uncontrolled and cannot be cleared afterwards.**
`sidebar/components/PtoSalaryCalculator.tsx` held its salary as `useState<number | undefined>()` and spread
`value={undefined}` onto a bare `<input>`, so React mounted the field uncontrolled and warned on the first
keystroke. Worse, `onChange` did `Number(e.target.value)`, and an emptied `type='number'` field gives `''`,
which is `0`; React wrote that `0` straight back into the box and re-applied it on every Backspace, so the
placeholder could never return. Hold a text field as a string and parse at the point of use; the numeric
state is derived, not stored.

[`core/animate/primitives/`](./core/animate/primitives) is a second, lower layer under `core/animate/`: the unstyled wrappers over
`@base-ui/react` that `core/animate/base/*` builds on. [`MotionSlot.tsx`](./core/animate/primitives/animate/MotionSlot.tsx) there is the shared `asChild`
mechanism used by [`core/animate/effects/AutoHeight.tsx`](./core/animate/effects/AutoHeight.tsx) and [`core/animate/icons/Icon.tsx`](./core/animate/icons/Icon.tsx).

It is internal to `core/animate/`, and that is now true rather than aspirational; it has zero importers
from outside. It had three. `DevFooter` took `RotatingTextContainer`, which turned out to publish into a
context nothing read; it is deleted. `CookieConsentDialog` and `AllowPastDays` took `Switch`, which was never
unstyled (it carried the full frame and shadow), so it moved up to [`core/animate/base/`](./core/animate/base) rather than getting
a wrapper. Promote what a feature needs; do not reach in.

`tutorial/DriverStyles.tsx` renders `null` and exists solely to make its CSS import lazy; [`useTutorial.tsx`](../hooks/useTutorial.tsx)
dynamic-imports it alongside the driver client so the tutorial stylesheet never lands in the initial
bundle. Deleting the "empty" component silently ships the CSS eagerly.

`export/HolidayDocument.tsx` is JSX but not DOM. Its elements come from `@react-pdf/renderer` and its
styles are `StyleSheet.create` objects, so Tailwind classes and `cn()` do nothing there. It is loaded
through a dynamic import inside an Effect program in [`sidebar/components/CalendarExport.tsx`](./sidebar/components/CalendarExport.tsx); importing
it statically would pull the whole PDF renderer into the client bundle.

`data-tutorial` attributes scattered through `sidebar/` and [`pages/planner/`](./pages/planner) are the tutorial's anchors, and
both sides now name them through `TUTORIAL_ANCHOR` in [`tutorial/anchors.ts`](./tutorial/anchors.ts) rather than as strings. They look
like dead attributes and are not, **but nine of them were**. The components declared nineteen anchors while
`useTutorial` targeted ten, and the gap was invisible in either direction: a step whose anchor is not
rendered lands on driver.js's dummy-element fallback with nothing highlighted and no error, which is exactly
how the mobile `open`-vs-`openMobile` bug stayed hidden. The nine unclaimed ones are gone; a future step adds
its anchor back through the const. [`tutorial/anchors.test.ts`](./tutorial/anchors.test.ts) reads the component tree and asserts the two
sets match in both directions.

`resolveApiErrorMessage` in `shared/utils/helpers.ts` tells a machine code from prose by shape. A
failure payload from this app carries a code (an `ApiError` value, or a Zod code such as
`email_required`), while the Stripe paths hand back a sentence Stripe has already localised, and
nothing on the wire says which one arrived. The `MACHINE_CODE` pattern is that test: snake_case with no
whitespace. An unrecognised code falls back to the generic message; prose is shown as it came. The
`as never` on the lookup key is next-intl narrowing its keys to the literals present in the bundle:
this key is only known at runtime, which is the question `has` exists to answer.

Payment analytics send the machine code, never the rendered message. `premium/CheckoutForm.tsx` shows
the user `resolveApiErrorMessage(...)` and passes the raw `result.error` to `track`; a translated
string would split one failure mode across six locales.

**The Premium gate broke that same rule for every one of its thirteen call sites, and the fix is a second
type.** `PremiumFeature` took `feature: string`, showed it to the user *and* handed it to
`showPremiumModal`, which is what `track('upgrade_modal_opened', { feature })` reports. Every producer was a
`useTranslations` call (`t('editHolidays')`, `t('metrics.advancedMetrics')`, `t('title')` from three
different namespaces), so thirteen gates over six locales were up to seventy-eight values in one dimension
and no two locales' funnels could be compared. The prop is a `PremiumFeatureId` now, declared beside the
state it sets in [`../../application/stores/premium.ts`](../../application/stores/premium.ts): the gate takes
the id, the store tracks the id, and `premium/featureLabels.ts` maps each id to the message key that already
held its label, so no translation moved and the modal still names the feature in the reader's language.
[`premium/PremiumFeature.test.tsx`](./premium/PremiumFeature.test.tsx) clicks the gate in en and in de and
asserts the store receives the same value both times.

The label map is the one place where an id and a message path meet, and it resolves through a
**namespace-less** `useTranslations()` because the thirteen labels live in seven different namespaces.
`satisfies Record<PremiumFeatureId, string>` is what makes a new id a compile error rather than a blank
banner.

**The analytics event is still called `upgrade_modal_opened`, and that is deliberate.** `CONTEXT.md` retires
*upgrade* as a word for Premium, and the identifiers went with it: `PremiumRequiredModal`,
`showPremiumModal`, the `premiumModal` message namespace, `premium.becomePremium`. The event id did not,
because it is a key in a Better Stack funnel that this repo cannot see: renaming it splits the series in two
with no way to stitch them. It is the one surviving instance of the retired word, in
[`../../infrastructure/clients/logging/better-stack/tracking.ts`](../../infrastructure/clients/logging/better-stack/tracking.ts)'s event union.

The Stripe Elements appearance in [`shared/donate/Donate.tsx`](./shared/donate/Donate.tsx) repeats the theme as hex literals. The
Elements iframe cannot read this app's CSS custom properties, so the light and dark objects mirror
`--card`, `--input`, `--foreground`, `--frame`, `--accent` (identical in both modes), `--secondary` and
`--muted-foreground` from [`src/ui/styles/global/index.css`](../styles/global/index.css) by value. Change a token there and this
object has to be changed by hand, or the donation form drifts from the page around it.

**One module answers how a sidebar control is labelled, and its interface is where the two accessibility
defects came from.** [`sidebar/components/SidebarFieldLabel.tsx`](./sidebar/components/SidebarFieldLabel.tsx) exports `SidebarFieldLabel` (icon, title,
optional tooltip, optional `controlId`) and `SidebarFieldTooltip` (the six-line
provider/trigger/content block, which four widgets use without a label around it). Eleven call sites had
written both out by hand, and the copies had drifted in ways nothing could see:

- **[`PtoDays.tsx`](./sidebar/components/PtoDays.tsx) carried `<label htmlFor='remaining-days'>` over a read-only status group, and no element
  in the tree has that id.** A label naming nothing is not inert: it is a promise to a screen reader that
  never resolves. It is a heading, so it takes no `controlId` now and renders a `div`; the module's test
  fails if that branch emits a `<label>` instead.
- **[`Years.tsx`](./sidebar/components/Years.tsx) used `id='years'` twice**: on the popover trigger and again on the `Command` inside the
  popover. With the popover open the document held two `#years`, and the label resolved to whichever came
  first. Nothing referenced the second one; it is gone.

**`controlId` may only name a labelable element, and two of the seven call sites named a `<div>`.**
`<label for>` resolves against the HTML labelable set (`button`, `input`, `select`, `textarea` and a
couple more), so the five sites pointing at a combobox trigger or a switch button are honest.
[`PtoDays.tsx`](./sidebar/components/PtoDays.tsx) named `Counter`, whose outer element is an `m.div`, and
[`CarryOverMonths.tsx`](./sidebar/components/CarryOverMonths.tsx) named `Slider`, whose Base UI `Root` is
also a `div`; in both cases the `id` was reaching the wrong element through `...props` and the label
resolved to nothing. Both drop `controlId` and render a heading instead, and the two widgets carry their
own names; see [`core/CLAUDE.md`](./core/CLAUDE.md).

The alternative was to make `SidebarFieldLabel` emit `aria-labelledby` against a generated id, and it is
worse: it would strip a working `htmlFor` from the five honest sites and still need every caller to thread
the id onto its own control, because this module renders no control. Naming the control is one edit in the
control; naming it from outside is an edit in both.

[`WorkdayCounter.tsx`](./sidebar/components/WorkdayCounter.tsx) was a twelfth hand-written copy: a bare
`Label` with the icon, the title and a `SidebarFieldTooltip` inside it, over a modal trigger it did not
name. It uses `SidebarFieldLabel` now, with `className='my-0'` to keep its own spacing.

The tooltip width is the caller's (`w-50` for the fields, `w-60` for the three calculators) and `Strategy`
keeps `font-medium` with no vertical margin, both passed through `className` so the render is unchanged.
That drift is real but cosmetic, and flattening it silently would have been a visual change hiding inside a
refactor.

**`useFormStatus` cannot report anything in this app, and one field had already drifted onto it.** React
reports `pending` only for a parent `<form>` submitted through a form **action**; all five forms here submit
through `onSubmit` and none has an `action`, so `pending` was a constant `false`, invisibly, because the type
is `boolean` either way. In `shared/donate/DonationForm.tsx` it was doubly dead: the hook was called by the
same module that renders the `<form>`, which React documents as never reporting. The drift it produced is the
part a payer met: the email field took `disabled={pending}` while the amount, the presets, the promo code and
the submit all took the real transition, so during the charge the one control still editable was the address
the receipt goes to, and the value being charged was the one captured at submit, so an edit mid-flight was
discarded without a word. `shared/FormButtons.tsx` had the same call behind a `pendingProp ?? pendingStatus`
fallback that every one of its three callers already satisfied. Both are gone and `pending` is a **required**
`boolean`, so a fourth form cannot forget to say whose transition it is on.

**One module owns the locale switch, and the line that looked like the mechanism was dead.**
`sidebar/components/LanguageSelector.tsx` and `pages/homepage/navigation/HomepageLanguageSwitcher.tsx` wrote
out the same policy character for character. `hooks/useLanguageSwitch.ts` holds it now; the two keep only
their triggers, which genuinely differ (the sidebar's collapses to a code and wraps in `AnimateIcon`).

Both copies carried `push(pathname.replace(`/${locale}`, `/${newLocale}`), { locale: newLocale })`, and the
`replace` could never match: `usePathname` from `@application/i18n/navigation` is next-intl's
`useBasePathname`, which returns the pathname **already unprefixed**. `push(…, { locale })` is what performs
the switch. Worse than useless: a route with a locale-looking segment, `/es-guide`, would have been rewritten
to `/en-guide`, which is the case the hook's test pins. `LanguageSelector` also held a `useState` mirroring
the menu's own uncontrolled open state, read by nothing but the props it fed back.

**`shared/ConditionalWrapper.tsx` has one arm, and it used to advertise two.** The second took `as` and
`wrapperProps` and rendered `<Component {...wrapperProps}>`, behind a `<T extends ElementType>` generic that
existed only to type it. Nothing ever called it: both call sites (`pages/planner/calendar/Calendar.tsx` for
the Holiday tooltip and `sidebar/components/PtoSalaryCalculator.tsx`) pass `wrapper`. The union, the
generic and the `"wrapper" in props` narrowing are gone; a conditional `<div>` is `doWrap && <div>`, which
needs no component.

**`pages/homepage/sections/Testimonials.tsx` does not shuffle, and the shuffle it had did nothing three
ways.** It is a `'use cache'` server component with `cacheLife('days')`, so `TESTIMONIAL_KEYS.toSorted(() =>
Math.random() - 0.5)` ran once per cache period rather than per visitor: the order every reader saw was
whatever one render happened to produce. `toSorted` with a random comparator is a biased shuffle regardless,
and `CARD_STYLES[idx]` keys the avatar colour and the tilt to the *slot*, so a re-render silently repainted
every testimonial. Rendering `TESTIMONIAL_KEYS` in order makes the colour a property of the person. Bringing
a real shuffle back means moving it out of the cached body, and choosing between six styles keyed by index
and six keyed by testimonial.

`BRIDGE_WEEK` in [`pages/homepage/sections/Features.tsx`](./pages/homepage/sections/Features.tsx) is the shape the card's copy describes:
Workdays Monday to Wednesday, a Thursday Holiday, a Friday PTO Day, then the weekend: a Bridge.
Reordering the array desyncs the illustration from the translated text beside it.

**[`sidebar/AppSidebar.tsx`](./sidebar/AppSidebar.tsx) mounts no `SidebarProvider` and must not grow one back.** It returns a
fragment of `Sidebar` plus `SidebarInset` and reads the context from `app/[locale]/(app)/planner/layout.tsx`,
the app's only mount site. It used to open a second provider inside the layout's, which gave the tree two
independent `open`/`openMobile` pairs and two nested `div.flex.min-h-svh.w-full` wrappers; consumers agreed
with each other only because they all happened to render inside the inner one. `Sidebar.test.tsx` fails on a
second mount anywhere under `src/`. It also means `AppSidebar` is not self-contained: a host other than that
layout has to supply the provider.

**[`shared/donate/Donate.tsx`](./shared/donate/Donate.tsx)'s trigger is a `fixed` band, and the band is `pointer-events-none` while the
button inside it is `pointer-events-auto`.** Below `md` the container is `w-full` and the `Button` inside
carries `w-full` too, so the two edges coincide and the band is the button; that is the full-bleed mobile
CTA and deleting the `w-full` would shrink it to its text. What the guards buy is the gap the container can
open without anyone editing it: `donate-brutal`'s `nudge` keyframes translate the button up to 3px sideways
for the last 12% of every four-second cycle, and `md:w-auto` reverses the coincidence outright the moment a
caller passes a narrower child. A `fixed` element at `z-50` spanning the viewport is worth making inert by
construction rather than by measurement.

**The `bottom-[calc(15dvh+8px)]` default in the same file is the mobile planner drawer's collapsed snap
point, written out by hand.** `DRAWER_SNAP.COLLAPSED` in [`pages/planner/ManagementBar.tsx`](./pages/planner/ManagementBar.tsx) is `0.15` and
nothing keeps the two in step: change the snap point and the donate button either rides on top of the drawer
or floats away from it. The marketing page already overrides the whole value with `bottomClassName`, which is
the seam a fix would use: the planner layout passing its own offset, rather than a shared component holding
one screen's number as its default.

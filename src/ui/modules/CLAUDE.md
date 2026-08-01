# src/ui/modules

Every React component the product renders. Nothing else in `src/ui/` holds components — `hooks/`,
`utils/`, `adapters/`, `styles/`, `assets/` and `i18n/` are support code, and the route files under
`src/app/` are thin: they compose modules and pass `locale` down.

## Layout

| Folder | Holds | Reused across screens? |
| --- | --- | --- |
| `core/` | The design system: `primitives/` plus the `animate/` layer. See [core/CLAUDE.md](./core/CLAUDE.md) | Yes, everywhere |
| `pages/` | One folder per screen — `homepage/`, `planner/`, `legal/`, `error/`, `not-found/`. See [pages/planner/CLAUDE.md](./pages/planner/CLAUDE.md) | No, by definition |
| `shared/` | Cross-page pieces that are not primitives: footer, donate, contact, cookie consent, JSON-LD, `shared/Logo.tsx`, `shared/Icon.tsx`, `shared/FormButtons.tsx`, `shared/SupportButton.tsx`, `shared/ConditionalWrapper.tsx`, `shared/WebMCP.tsx`, plus `shared/utils/helpers.ts` for the helpers those pieces need | Yes |
| `layout/` | `layout/LegalLayout.tsx` only — the card chrome the four legal pages share | Between sibling routes |
| `sidebar/` | `sidebar/AppSidebar.tsx` and its controls: country, region, year, Strategy, PTO Day budget, the calculators, calendar export | One screen, but not a page section |
| `premium/` | The Premium gate and the Donation checkout: `premium/PremiumFeature.tsx`, `premium/PremiumModal.tsx`, `premium/UpgradeModal.tsx`, `premium/CheckoutForm.tsx` | Yes |
| `providers/` | Context wrappers mounted once in the locale layout: `providers/AppThemeProvider.tsx`, `providers/BonesProvider.tsx` | Once |
| `stores/` | `stores/StoresInitializer.tsx` — a render-nothing component that seeds the filters store from the `user-country` cookie | Once |
| `tutorial/` | `tutorial/DriverStyles.tsx` only — a render-nothing component whose single job is to make the driver.js stylesheet import lazy | Once |
| `tracking/` | The third-party script mounts: `tracking/Analytics.tsx` (Google gtag consent defaults and config) and `tracking/BetterStackTracking.tsx` (the Better Stack snippet, gated on the cookieconsent `analytics` category) | Once |
| `export/` | `export/HolidayDocument.tsx` — the `@react-pdf/renderer` document tree. Not DOM React; it renders in the PDF reconciler only | Once |
| `bones/` | Generated skeleton data, see below. Not hand-written | n/a |

`core/` is the only folder allowed to be imported by everything else. It is also the only folder that
must not import anything back: no stores, no `useTranslations`, no data fetching.

## Where a new component goes

Walk the questions in order and stop at the first yes.

1. Is it a stateless visual element with no product vocabulary in it — a button, a field, a badge, an
   animated icon? → `core/`. It takes strings as props; it never calls `useTranslations`.
2. Does it exist because one screen needs it? → `pages/<screen>/`. Split further into a subfolder once
   the screen folder passes roughly a dozen files, as `planner/` has.
3. Is it mounted by more than one screen and does it carry product meaning? → `shared/`.
4. Does it gate something behind Premium, or move money? → `premium/`, whatever screen uses it. Access
   is derived from the payment record, not stored as a flag — [ADR 0008](../../../docs/adr/0008-premium-derived-from-payment.md).
5. Is it a context provider, or a component whose whole job is a side effect and whose render is
   `null`? → `providers/`, `stores/`, `tracking/` or `tutorial/` depending on what the effect is: a
   context wrapper, seeding a store, mounting a consent-gated third-party script, or loading the
   tutorial's lazy stylesheet.

The awkward case is a `shared/` component that needs a helper living under `pages/`. That import points
the dependency the wrong way, so the helper moves up to `shared/utils/helpers.ts` instead — which is what
`getViewBoxFromSvg` did once `shared/Icon.tsx` became its only caller. The same rule settles a component
one screen keeps in its own folder while a second screen renders it: it moves to `shared/`, not sideways
into the other screen.

## Conventions

**No barrel files.** There is not a single `index.ts` anywhere in `src/`. Import the module directly.

**Named exports only.** `default` appears only inside `dynamic()` calls, where Next.js requires it —
hence the `.then((m) => ({ default: m.X }))` dance you will see repeatedly.

**Tests sit next to the component** as `*.test.tsx`, never in a `__tests__/` folder. So do
co-located stylesheets: `pages/planner/legend.module.css`, `pages/planner/contact.css` and
`shared/donate/donate.css` live beside the component that imports them. Only cross-cutting CSS belongs
in `src/ui/styles/`.

**`*Client.tsx` means two different things.** The suffix is not a single convention, and reading it as
one will mislead you:

- A thin `'use client'` shell that `dynamic()`-imports the real component with `ssr: false`, purely to
  keep a heavy dependency out of the server bundle — `shared/donate/DonateClient.tsx`,
  `shared/cookie-consent/CookieConsentClient.tsx`. The shell takes the same props and forwards them.
- The interactive half of a server/client pair, where the server sibling does the fetching —
  `sidebar/components/Countries.tsx` awaits `getCountries` and hands the result to
  `sidebar/components/CountriesClient.tsx`. `pages/homepage/sections/HomepageCta.tsx` and
  `pages/homepage/sections/CtaShapesClient.tsx` are the same pair for translated strings.

Whichever it is, the export carries the file's name. Without barrel files every import site has to spell
the module path anyway, so a file whose export is named something else just makes it unfindable.

**`*Fixture.tsx` is a static placeholder**, not a test fixture. See the skeleton section.

**Server by default.** A file gets `'use client'` only when it needs state, an effect, a store or a
browser API. `sidebar/AppSidebar.tsx` and `layout/LegalLayout.tsx` are `async` server components that
call `getTranslations` from `next-intl/server`; client components use the `useTranslations` hook. The
planner itself is client-side end to end — [ADR 0001](../../../docs/adr/0001-planner-runs-in-the-browser.md).

## Skeletons and bones

Loading states go through `boneyard-js`, not hand-rolled shimmer divs. Three pieces cooperate:

- `bones/*.bones.json` — captured DOM shapes, regenerated by `pnpm bones:build`. Output path and
  colours come from [boneyard.config.json](../../../boneyard.config.json).
- `bones/registry.ts` — generated, carries a "do not edit" banner. It registers every bone under a
  string name and calls `configureBoneyard`.
- `providers/BonesProvider.tsx` — imported by the locale layout, renders `null`. It side-effect imports
  the registry and then calls `configureBoneyard` again with `boneClass: 'boneyard-bordered'` added.
  Order matters: the registry's call runs first (imports are hoisted), so the provider's config is the
  one that wins. Change the provider, not the generated file.

`<Skeleton name='…' fixture={…}>` looks the bone up by name and falls back to the fixture component if
no bone is registered. The fixtures — `pages/planner/calendar/CalendarListFixture.tsx`,
`pages/planner/PlannerPanelFixture.tsx`, `pages/planner/summary/SummaryFixture.tsx`,
`premium/ExpressCheckoutFixture.tsx` — are hand-written approximations kept beside their component.

Registered names and used names have drifted apart: `alternatives-manager` and `pto-status` are
registered but no `<Skeleton>` asks for them, and `express-checkout` in `premium/CheckoutForm.tsx` asks
for a bone that was never captured, so it always renders its fixture. Re-run `pnpm bones:build` rather
than editing the JSON if you need to close that gap.

## Testing

Vitest, `happy-dom`, co-located `.test.tsx`. Two exclusions in `vitest.config.ts` matter here:

- `src/ui/modules/bones/**` — excluded from both the test run *and* the coverage report. It is
  generated data; asserting on it would only assert that the generator ran.
- `src/ui/modules/core/animate/icons/**` — same treatment, for the same reason: mechanical SVG wrappers.

Coverage is deliberately uneven and you should not read a missing test as an oversight to fix in
passing. `core/animate/` is tested close to exhaustively; `core/primitives/` has no tests at all;
`pages/`, `shared/` and `sidebar/` have tests only where logic lives (`ManagementBar`, `Summary` charts,
homepage sections, `shared/utils/helpers.ts` and the two forms that render an API failure). Components whose body is markup plus translation calls are covered by the Playwright
suite in `e2e/` instead.

When a component is mocked in a sibling's test, mock the module path it actually imports —
`premium/CheckoutForm.test.tsx` mocks both `boneyard-js/react` and `./ExpressCheckoutFixture`, because
leaving either real drags the Stripe element tree into the test.

## Gotchas

`core/animate/primitives/` is a second, lower layer under `core/animate/` — the unstyled wrappers over
`@base-ui/react` that `core/animate/base/*` builds on. `MotionSlot.tsx` there is the shared `asChild`
mechanism used by `core/animate/effects/AutoHeight.tsx` and `core/animate/icons/Icon.tsx`.

It was meant to be internal to `core/animate/`, and it is not: three files outside `core/` reach into it by
alias today — `shared/cookie-consent/CookieConsentDialog.tsx` and `sidebar/components/AllowPastDays.tsx` both
import `Switch` from `primitives/base/`, and `shared/footer/components/DevFooter.tsx` imports
`RotatingTextContainer` from `primitives/texts/`. So it is a public surface in practice. Either promote what
those three need into `core/animate/base/` and re-privatise the folder, or stop describing it as internal —
what is not defensible is the current state, where the rule exists only in prose and is already broken.

`tutorial/DriverStyles.tsx` renders `null` and exists solely to make its CSS import lazy — `useTutorial.tsx`
dynamic-imports it alongside the driver client so the tutorial stylesheet never lands in the initial
bundle. Deleting the "empty" component silently ships the CSS eagerly.

`export/HolidayDocument.tsx` is JSX but not DOM. Its elements come from `@react-pdf/renderer` and its
styles are `StyleSheet.create` objects, so Tailwind classes and `cn()` do nothing there. It is loaded
through a dynamic import inside an Effect program in `sidebar/components/CalendarExport.tsx`; importing
it statically would pull the whole PDF renderer into the client bundle.

`data-tutorial="*"` attributes scattered through `sidebar/` and `pages/planner/` are the tutorial's
anchors. They look like dead attributes and are not.

`resolveApiErrorMessage` in `shared/utils/helpers.ts` tells a machine code from prose by shape. A
failure payload from this app carries a code — an `ApiError` value, or a Zod code such as
`email_required` — while the Stripe paths hand back a sentence Stripe has already localised, and
nothing on the wire says which one arrived. The `MACHINE_CODE` pattern is that test: snake_case with no
whitespace. An unrecognised code falls back to the generic message; prose is shown as it came. The
`as never` on the lookup key is next-intl narrowing its keys to the literals present in the bundle —
this key is only known at runtime, which is the question `has` exists to answer.

Payment analytics send the machine code, never the rendered message. `premium/CheckoutForm.tsx` shows
the user `resolveApiErrorMessage(...)` and passes the raw `result.error` to `track`; a translated
string would split one failure mode across six locales.

The Stripe Elements appearance in `shared/donate/Donate.tsx` repeats the theme as hex literals. The
Elements iframe cannot read this app's CSS custom properties, so the light and dark objects mirror
`--card`, `--input`, `--foreground`, `--frame`, `--accent` (identical in both modes), `--secondary` and
`--muted-foreground` from `src/ui/styles/global/index.css` by value. Change a token there and this
object has to be changed by hand, or the donation form drifts from the page around it.

`BRIDGE_WEEK` in `pages/homepage/sections/Features.tsx` is the shape the card's copy describes:
Workdays Monday to Wednesday, a Thursday Holiday, a Friday PTO Day, then the weekend — a Bridge.
Reordering the array desyncs the illustration from the translated text beside it.

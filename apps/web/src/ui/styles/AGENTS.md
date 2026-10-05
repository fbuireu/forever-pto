# apps/web/src/ui/styles

## Purpose

The app's cross-cutting stylesheets; a component's own stylesheet sits beside it (`shared/donate/donate.css`,
`pages/planner/contact.css`, `pages/planner/legend.module.css`, `tutorial/driver.css`). Tailwind CSS is configured entirely in CSS; there is no
`tailwind.config.*` anywhere in the repo. PostCSS runs a single plugin (`@tailwindcss/postcss`, see
[`postcss.config.mjs`](../../../postcss.config.mjs)) and [`index.css`](./index.css) is the whole configuration surface: tokens, custom variants and
custom utilities are all declared here in CSS at-rules.

`index.css` is the entry point, imported through the `@styles/*` alias by `layout.tsx`,
[`global-error.tsx`](../../app/global-error.tsx) and [`global-not-found.tsx`](../../app/global-not-found.tsx). The tour's stylesheet,
[`driver.css`](../modules/tutorial/driver.css), sits beside [`DriverStyles.tsx`](../modules/tutorial/DriverStyles.tsx), which imports it so the
tutorial CSS only loads when the tutorial does.

Tailwind finds the classes to emit by scanning every file under `apps/web` that git does not ignore, so `index.css` ends
with three `@source not` lines that take out the test files, the `e2e` folder and the Markdown and MDX: a class that only
a fixture or an example spells would otherwise become a rule in the shipped stylesheet. A new kind of file the app does
not ship gets a line of its own. The contract suite builds the stylesheet with Tailwind's own compiler and scanner, and
fails on a scanned test, e2e spec or Markdown file and on any palette utility in the output.

## Files

| File | Role |
| --- | --- |
| `index.css` | Declares the cascade layer order, imports Tailwind, `tw-animate-css` and every partial below, and ends with the `@source not` exclusions |
| [`base/index.css`](./base/index.css) | `@layer base`: element defaults: border/outline colour, body background and glow, scrollbar styling, the shared transition on buttons and shadcn slots |
| [`theme/index.css`](./theme/index.css) | `@theme inline` bridges the design tokens into Tailwind's namespaces; `@theme static` always emits the Tailwind theme variables a CSS module reads (`--spacing`, `--text-xs`, `--text-sm`, `--text-3xl`, `--shadow-lg`, at Tailwind's own values); also the `dark` and `hover` custom variants |
| [`utilities/index.css`](./utilities/index.css) | `@utility hit-area-stable`, `hit-area-stable-tilt` and `quiet-link` |
| [`animations/index.css`](./animations/index.css) | `@layer animations`: keyframes, the root view-transition, the reduced-motion block |
| [`global/index.css`](./global/index.css) | The design tokens: `:root` and the `[data-theme="dark"]` overrides. Deliberately unlayered |
| [`vendor/index.css`](./vendor/index.css) | `@layer vendor`: `flag-icons`, cookie-consent and boneyard-js overrides, `::selection` |
| [`palette.ts`](./palette.ts) | The tokens' JS twin: the colours a consumer that cannot read a custom property takes by value (the Stripe iframe, the skeletons, the PDF, the confetti) |
| [`palette.test.ts`](./palette.test.ts) | Holds `palette.ts` equal to the tokens it repeats, and keeps every colour out of `boneyard.config.json` and the registry generated from it |
| [`contrast.test.ts`](./contrast.test.ts) | Evaluates the fill, the stripe and the ink of every brand-filled calendar day in both themes and holds the ink at WCAG AA |
| [`index.test.ts`](./index.test.ts) | Reads the stylesheets as text and guards the invariants a reader is most likely to "tidy away" |

## The cascade layer order

Line 1 of `index.css` is `@layer base, theme, animations, tutorial, vendor;`, and it sits
**above** `@import "tailwindcss"`. Both properties of that placement are load-bearing:

- **First declaration wins.** Tailwind's own `@layer theme, base, components, utilities;` arrives with
  its import; because `base` and `theme` already exist by then, they keep the positions set here, and
  Tailwind's `components` and `utilities` are appended after `vendor`. That is why a Tailwind utility
  class still beats the vendor overrides, and why those overrides reach for `!important` when they
  need to win anyway.
- **`tutorial` is a reservation for a stylesheet that is not imported here.** `modules/tutorial/driver.css` and
  the `driver.js` CSS it pulls in arrive only when `DriverStyles.tsx` mounts. Without the slot named up
  front, that layer would be appended last and driver.js's defaults would outrank the app's own
  tutorial styling. Do not remove `tutorial` from the list because nothing in this folder emits into
  it from `index.css`.

**`global` is not in that list, deliberately.** `global/index.css` is *not* wrapped in `@layer global`:
it is plain `:root` and `[data-theme="dark"]` blocks, and unlayered declarations outrank every layer, so the
design tokens win outright. Wrapping the file in `@layer global`, or reserving a `global` slot for it, would
demote every design token below Tailwind's utilities. The same reasoning covers the `:root` block at the top
of `modules/tutorial/driver.css`: leave it unlayered.

One consequence worth knowing: `!important` inverts layer precedence, so the reduced-motion block in
`animations/index.css`, an early layer, outranks important declarations from later layers and from
unlayered rules. That is why it can flatten animations globally from where it sits.

**It flattens CSS animation, and only CSS animation.** `motion/react` drives transform, opacity and filter
through the Web Animations API and direct inline style writes; a `transition-duration: 0.01ms !important`
rule reaches neither, so this block alone would leave the page springing, sliding and blurring with
reduce-motion set. The motion half is handled by `<MotionConfig reducedMotion="user">` in
[`../modules/core/animate/providers/LazyMotionProvider.tsx`](../modules/core/animate/providers/LazyMotionProvider.tsx);
this block owns everything CSS animates, and they are not substitutes.

**The two panels motion animates take `0s` instead.** Base UI reads a Collapsible or Accordion panel's computed
durations to pick how it animates the panel, and `0.01ms` on both an animation and a transition makes it warn
on every panel that mounts open; `[data-slot="collapsible-content"]` and `[data-slot="accordion-panel"]` are
animated by motion, so no CSS duration on them draws anything. `index.test.ts` holds the two slots to the ones
the components render.

## Design tokens

All tokens live in `global/index.css`, in tiers:

1. **Brand palette**: `--color-brand-*` raw hex, plus `--brand-gradient`, `--frame` (the neo-brutalist
   outline colour) and the `--surface-panel*` set.
2. **Semantic shadcn/ui tokens**: `--background`, `--foreground`, `--card`, `--popover`, `--primary`,
   `--secondary`, `--muted`, `--destructive`, `--border`, `--input`, `--ring`, the `--sidebar-*` set
   and `--radius`.
3. **The shadow scale**: `--shadow-brutal-*`, hard zero-blur offsets drawn in `--frame`. Because
   `--frame` flips between ink and cream with the theme, every shadow inverts for free.
4. **Role tokens**: a colour a component needs that no tier above holds, named for the part it plays and declared with
   both of its values, so the component writes one class (`text-positive`) and no `dark:` pair.

| Family | Tokens | Part they play |
| --- | --- | --- |
| Fixed | `--on-fill`, `--shade`, `--success`, `--success-hover`, `--star`, `--crown`, `--live`, `--terminal-*` | White on any solid fill; black taken at an alpha for scrims, hairlines and shadows; the success `Button` green, which the tour's Done button casts; the rating star, the crown and the pulsing dot; the error page's console, dark in both themes |
| Tones | `--positive`, `--positive-strong`, `--positive-note`, `--positive-base`, `--positive-action`, `--negative`, `--unused-value`, `--caution`, `--caution-note`, `--caution-base`, `--effective-rate`, `--warning-note`, `--warning-base`, `--comparison-neutral` | Text, icon and tinted border of a figure by what it says: the bare name for an icon or a label, `-strong` for a headline figure, `-note` for small print, `-base` for the shade that takes an alpha |
| Series | `--efficiency*`, `--suggested*`, `--manual*`, `--info-*`, `--workday-*` | The planner's own colours: efficiency, Suggested Days, Manual Days, the information box and the workday badge |
| Washes | `--wash-<hue>` with its `-chip`, `-card`, `-badge`, `-panel`, `-icon`, `-title`, `-message`, `-ink`, `-figure`, `-caption` and `-badge-ink` parts, `--day-alternative`, `--day-custom` | A brand hue tinted into a surface, toward white in light and toward black in dark, and the ink that reads on it; `Banner`, `MetricCard`, the stat cards and the calendar's day fills draw with them |
| Overlays | `--divider`, `--dialog-scrim`, `--shadow-drawer`, `--stripe-*`, `--holiday-fill` | The hairline between list rows on a themed surface (black at 15 % in light, the frame at 15 % in dark, where black vanished on the dark panel; a brand-coloured card does not flip, so its rows keep `border-shade/15`), the dialog's backdrop, the drawer's shadow, the hatching on alternative, custom and manual days, and the holiday gradient |
| Networks | `--social-github`, `--social-linkedin`, `--social-bluesky`, `--social-coffee` | The footer icons' hover colours, which are the networks' own |

`theme/index.css` maps every role token that is a single colour (all but the gradients, the stripes and the networks), so
`text-positive`, `bg-wash-teal` and `border-divider` are utilities; the rest are read with `var()`, as `--frame` and the
shadow scale are. A colour with no token gets one in both blocks of `global/index.css`; a literal anywhere else in
`apps/web/src` fails the contract suite.

**The ink on a brand fill is `--color-brand-ink`, in both themes.** No `--color-brand-*` hue is overridden under
`[data-theme="dark"]`, so a day filled with one keeps its fill in dark mode, and the text on it keeps its ink:
`--foreground` flips to cream there and does not reach AA on those fills. [`contrast.test.ts`](./contrast.test.ts)
evaluates each brand-filled day of `MODIFIERS_CLASS_NAMES` in both themes (the fill, the stripe laid over it and the
ink) and holds the ink at 4.5:1 or better. A `var(--x)` that nothing declares resolves to nothing and the property
falls back to the inherited value, so the contract suite fails a custom property read in `apps/web/src` that no
stylesheet, style key, arbitrary property, `setProperty`, font `variable`, Base UI `CssVars` module or Tailwind default
theme declares. A CSS module is held to a stricter list: Tailwind emits its default theme variables only while a
utility uses them and never compiles a module, so `legend.module.css` could lose `--text-sm` or `--shadow-lg` to a
refactor of some unrelated class. Whatever a module reads of Tailwind's scale, `theme/index.css` declares in its
`@theme static` block, which Tailwind always emits, and the check counts no default theme and no plain `@theme` block
for a module.

**A consumer that cannot read a custom property takes a constant from [`palette.ts`](./palette.ts).** The Stripe
Elements iframe, `boneyard-js` (which computes with the colour), the PDF renderer and `canvas-confetti` receive a value,
not a stylesheet: `STRIPE_LIGHT_PALETTE` and `STRIPE_DARK_PALETTE`, `BONES_COLORS`, `PDF_PALETTE` and `CONFETTI_COLORS`.
`palette.test.ts` holds the Stripe palettes and the skeleton colours equal to the tokens they repeat. `BonesProvider.tsx`
hands the skeleton colours to `boneyard-js`, so `boneyard.config.json` and the `bones/registry.ts` the CLI generates from
it carry none. The email has a token module of its own, [`application/email/palette.ts`](../../application/email/palette.ts),
because the application layer reaches `src/ui` through one module only and a mail client reads no custom property: the
template hands `EMAIL_PALETTE` to react-email's Tailwind config, which inlines `text-email-ink` and `bg-brand-teal` into
the message. The four token modules are the only files of `apps/web/src` that hold a colour: the contract suite fails a
literal in any other, generated or not.

Dark mode overrides a subset of those under `[data-theme="dark"]`. [`AppThemeProvider.tsx`](../modules/providers/AppThemeProvider.tsx) configures
next-themes with `attribute={['data-theme', 'class']}`, so `<html>` carries the theme twice: as `data-theme`, which the
tokens and the `dark` variant read, and as a `dark` or `light` class, which `boneyard-js` reads to pick the dark
colours of a skeleton (it looks for `.dark` on `<html>` or an ancestor and for nothing else). The first-paint script
writes both before the first frame. The class exists for that reader alone: the theme is styled through the
`data-theme` tokens, and a stylesheet rule keyed on `.dark` or `.light` would be a second source of it.

`theme/index.css` is the bridge from tokens to utility classes. `@theme inline` matters: the generated
theme variable holds `var(--background)` rather than a resolved colour, so the `[data-theme="dark"]`
overrides propagate into `bg-background`, `text-muted-foreground`, `rounded-lg` and the rest at
runtime. A token added to `global/index.css` is invisible to Tailwind until it is also mapped here.

Fonts come from [`fonts.ts`](../../app/fonts.ts) (next/font), which exposes `--font-space-grotesk`, `--font-bricolage`,
`--font-instrument-serif` and `--font-jetbrains-mono`; `theme/index.css` maps them onto
`--font-sans`, `--font-display`, `--font-serif` and `--font-mono`. Adding a family means editing both.

## Custom variants

- `@custom-variant hover (&:hover)` **replaces** Tailwind's built-in `hover`, which wraps the rule
  in `@media (hover: hover)`. With the override, `hover:` utilities also apply on coarse pointers. It
  reads like a no-op redefinition; it is not.
- `@custom-variant dark (&:is([data-theme="dark"] *))` matches *descendants* of the themed element
  only. Since `data-theme` is set on `<html>`, `dark:` utilities never apply to `<html>` itself, so
  style the root through the token overrides in `global/index.css` instead.

## quiet-link

The nav-and-footer link treatment: a transparent 3px border that fills with `--accent` and `--frame` on
hover, over 75ms. Its call sites are most of [`Footer.tsx`](../modules/shared/footer/Footer.tsx)'s links,
`ContactButton`, `CookieButton`, `Navigation`, [`Faq.tsx`](../modules/pages/homepage/sections/Faq.tsx) and the
planner's `Contact`.

It is a `@utility` rather than a `Button` variant because only a minority of the sites are `Button`s. The
rest are the locale-aware `Link` and `createRichLink`, which a CVA variant would not reach.

**The call sites differ, and one difference is drift.** `h-auto` appears only on the `Button` sites, because
`Button` sets a height and `Link` does not. `Navigation` uses `px-2 py-1` where everyone else uses
`px-1.5 py-0.5`. The font weight genuinely disagrees: some sites say `font-medium` and others say
`font-semibold`, and nothing distinguishes them.

## hit-area-stable

An element that lifts on hover (`hover:-translate-x-0.5 hover:-translate-y-0.5`, used all over the
neo-brutalist primitives) can move out from under the cursor: the pointer leaves, the transform
reverts, the element slides back under the pointer, and the hover state oscillates. `hit-area-stable`
pins the hit area while the box moves, using a transparent `::after` at `inset: 0` behind the element
(`z-index: -1`) that grows into the vacated space on `:hover` (`inset: 0 -8px -8px 0`) and on
`:active` (`inset: -8px 0 0 -8px`, mirrored because the press moves the box the other way).

Its users include [`Button.tsx`](../modules/core/primitives/Button.tsx),
[`Badge.tsx`](../modules/core/primitives/Badge.tsx), [`Slider.tsx`](../modules/core/primitives/Slider.tsx), the animate primitives ([`Accordion.tsx`](../modules/core/animate/base/Accordion.tsx), [`Collapsible.tsx`](../modules/core/animate/base/Collapsible.tsx), [`Dialog.tsx`](../modules/core/animate/base/Dialog.tsx),
[`Sidebar.tsx`](../modules/core/animate/base/Sidebar.tsx), [`Tooltip.tsx`](../modules/core/animate/base/Tooltip.tsx)), the planner calendar day cells and the homepage sections.

`hit-area-stable-tilt` is the variant for elements that *rotate* on hover rather than translate
(`rotate-[-1deg]` → `hover:rotate-0`, in [`Pricing.tsx`](../modules/pages/homepage/sections/Pricing.tsx) and [`Testimonials.tsx`](../modules/pages/homepage/sections/Testimonials.tsx)). A rotation moves every
edge, so its hover inset is symmetric (`inset: -16px`) and it has no `:active` case.

Both set `position: relative` through `:where(&)`, which contributes zero specificity, so a component
can still set its own positioning without `!important`.

The same trick is hand-written for the driver.js buttons in `modules/tutorial/driver.css`, because an `@utility` cannot be
applied to markup a library owns, and that file is compiled on its own without importing Tailwind, so
`@apply` has nothing to resolve either. Keep the three insets of its `::after` rules in step with this
utility; change the insets here and the copy will not follow, and nothing fails when they drift.

**The driver.js buttons copy `Button`'s variants by value for the same reason.** Next is the `default`
variant, so it casts the accent trio: an ink face over a frame shadow would show no shadow at all. Done is `success`,
so it reads `--success`, `--success-hover` and `--on-fill` as custom properties of the page, since the theme
variables Tailwind emits belong to a build this file is not part of. Previous is `outline`, and the
close button is the Dialog's. The step counter takes the quick start's mono kicker, and the title keeps room
on its right for the close button, as a Dialog header row does. Retune a variant in `Button.tsx` and these
rules will not follow.

## Biome formats all of these folders

Biome's CSS parser rejects Tailwind-only at-rules by default: `@apply` in `base/`, `@theme inline` and
`@custom-variant` in `theme/`, `@utility` in `utilities/` all parse as errors, and a parse error aborts
formatting for the whole file. [`biome.json`](../../../../../biome.json) sets `css.parser.tailwindDirectives: true`, which teaches
the parser those at-rules, so every file in this folder is formatted and linted like any other: double
quotes, LF, 120 columns, applied by the tool rather than by hand. Excluding a folder from `files.includes`
instead would drop it from `pnpm format:all` and `pnpm lint:all` alike.

## Gotchas

- `base/index.css` gives every `section[id]` `content-visibility: auto` with
  `contain-intrinsic-size: auto 800px`. Off-screen sections are not laid out, so anything that
  measures a section before it scrolls into view reads the 800px placeholder, not the real height.
- `body` paints `--page-glow` with `background-attachment: fixed`, so the glow does not scroll with
  the content. Setting `background` (rather than `background-color`) anywhere on `body` wipes it.
- `vendor/index.css` hides `#cc-main` with `display: none !important`. `vanilla-cookieconsent` still
  runs and still owns consent state; only its UI is suppressed, because the app renders its own
  [`CookieConsentDialog.tsx`](../modules/shared/cookie-consent/CookieConsentDialog.tsx). Do not "fix" this by disabling the library.
- **No rule here makes the boneyard-js content wrapper `display: contents`, and none may.** The CLI snapshots the
  `firstElementChild` of `[data-boneyard]` (the `data-boneyard-content` wrapper that server rendering put there and
  hydration keeps), and an element with `display: contents` answers every `getBoundingClientRect()` with zeros, so
  every bone recorded a width of 0 and a document offset for its top: the registry held 4px slits until the rule that
  unwrapped it went. The wrapper is a plain block in the `position: relative` box the skeleton already is, which lays
  its content out as before. `skeleton.test.tsx` fails on a stylesheet that unwraps it and holds every bone the
  registry carries to a width and a place inside its container.
- **`animations/index.css` declares no `shimmer` keyframe, and must not grow one.** Nothing could reach it:
  no rule writes `animation: shimmer`, `theme/index.css` declares no `--animate-*` variable so Tailwind can
  generate no `animate-shimmer` utility, and `boneyard-js` injects its own `@keyframes bs-<uid>` at runtime for
  `animate: 'shimmer'`, never one called `shimmer`. Every other keyframe in the file has a named caller. A
  keyframe by that name would read like the skeleton animation and not be one, which is exactly what makes
  the next reader wire a component to it.
- `--container-8xl` in `theme/index.css` exists for one class, `max-w-8xl` in `planner/page.tsx`.
  Tailwind resolves `max-w-*` from `--max-width-*`, then `--spacing-*`, then `--container-*`, so a
  `--max-width-8xl` beside it would shadow it, and deleting `--container-8xl` would silently drop the class.

## Testing

`index.test.ts` reads CSS as text rather than rendering anything. It
pins the things that look like tidy-ups and are not: the design tokens stay unlayered and the
layer statement reserves no slot for them, the `tutorial` slot stays reserved, `theme/index.css`
keeps `--container-8xl` without a `--max-width-8xl` mirror, and `index.css` reaches every stylesheet in the
folder, so one that a single component imports fails until it moves beside that component. `palette.test.ts` holds
the palette module to the tokens, `contrast.test.ts` holds the ink on every brand-filled calendar day at AA in both
themes, and the contract suite (`tests/docs-consistency.test.ts`) holds every other file of `apps/web/src` free of a
literal colour, a hex, a colour function, a palette class or a `white` or `black`, holds every custom property read
there to a declaration, and builds the shipped stylesheet to fail on a scanned fixture or a palette utility.

Nothing checks that a new `hover:-translate-*` carries `hit-area-stable`, or that the driver.js copy of it
in `modules/tutorial/driver.css` still matches.

# apps/web/src/ui/styles

## Purpose

Every stylesheet the app ships. Tailwind CSS v4 is configured entirely in CSS; there is no
`tailwind.config.*` anywhere in the repo. PostCSS runs a single plugin (`@tailwindcss/postcss`, see
[`postcss.config.mjs`](../../../postcss.config.mjs)) and [`index.css`](./index.css) is the whole configuration surface: tokens, custom variants and
custom utilities are all declared here in CSS at-rules.

`index.css` is the entry point, imported through the `@styles/*` alias by `layout.tsx`,
[`global-error.tsx`](../../app/global-error.tsx) and [`global-not-found.tsx`](../../app/global-not-found.tsx). [`lazy/index.css`](./lazy/index.css) is the deliberate exception — it is
imported by [`DriverStyles.tsx`](../modules/tutorial/DriverStyles.tsx) so the tutorial CSS only loads when the tutorial does.

## Files

| File | Role |
| --- | --- |
| `index.css` | Declares the cascade layer order, then imports Tailwind, `tw-animate-css` and every partial below |
| [`base/index.css`](./base/index.css) | `@layer base` — element defaults: border/outline colour, body background and glow, scrollbar styling, the shared transition on buttons and shadcn slots |
| [`theme/index.css`](./theme/index.css) | `@theme inline` — bridges the design tokens into Tailwind's namespaces; also the `dark` and `hover` custom variants |
| [`utilities/index.css`](./utilities/index.css) | `@utility hit-area-stable`, `hit-area-stable-tilt` and `quiet-link` |
| [`animations/index.css`](./animations/index.css) | `@layer animations` — keyframes, the root view-transition, the reduced-motion block |
| [`global/index.css`](./global/index.css) | The design tokens: `:root` and the `[data-theme="dark"]` overrides. Deliberately unlayered |
| [`vendor/index.css`](./vendor/index.css) | `@layer vendor` — `flag-icons`, cookie-consent and boneyard-js overrides, `::selection` |
| `lazy/index.css` | driver.js tutorial styling, loaded on demand |
| [`index.test.ts`](./index.test.ts) | Reads the stylesheets as text and guards the invariants a reader is most likely to "tidy away" |

## The cascade layer order

Line 1 of `index.css` is `@layer base, theme, animations, tutorial, vendor;`, and it sits
**above** `@import "tailwindcss"`. Both properties of that placement are load-bearing:

- **First declaration wins.** Tailwind's own `@layer theme, base, components, utilities;` arrives with
  its import; because `base` and `theme` already exist by then, they keep the positions set here, and
  Tailwind's `components` and `utilities` are appended after `vendor`. That is why a Tailwind utility
  class still beats the vendor overrides, and why those overrides reach for `!important` when they
  need to win anyway.
- **`tutorial` is a reservation for a stylesheet that is not imported here.** `lazy/index.css` and the
  `driver.js` CSS it pulls in arrive only when `DriverStyles.tsx` mounts. Without the slot named up
  front, that layer would be appended last and driver.js's defaults would outrank the app's own
  tutorial styling. Do not remove `tutorial` from the list because nothing in this folder emits into
  it from `index.css`.

**`global` is not in that list, deliberately.** `global/index.css` is *not* wrapped in `@layer global`
: it is plain `:root` and `[data-theme="dark"]` blocks, and unlayered declarations outrank every layer,
so the design tokens win outright. The statement used to name a `global` slot that no stylesheet ever
emitted into; the name invited exactly the wrong repair, because wrapping the file in `@layer global`
would demote every design token below Tailwind's utilities. Dropping an empty slot from the statement
changes no relative order and therefore no cascade. The same reasoning covers the `:root` block at the
top of `lazy/index.css`: leave it unlayered.

One consequence worth knowing: `!important` inverts layer precedence, so the reduced-motion block in
`animations/index.css`, an early layer, outranks important declarations from later layers and from
unlayered rules. That is why it can flatten animations globally from where it sits.

## Design tokens

All tokens live in `global/index.css`, in three tiers:

1. **Brand palette**: `--color-brand-*` raw hex, plus `--brand-gradient`, `--frame` (the neo-brutalist
   outline colour) and the `--surface-panel*` set.
2. **Semantic shadcn/ui tokens**: `--background`, `--foreground`, `--card`, `--popover`, `--primary`,
   `--secondary`, `--muted`, `--destructive`, `--border`, `--input`, `--ring`, the `--sidebar-*` set
   and `--radius`.
3. **The shadow scale**: `--shadow-brutal-*`, hard zero-blur offsets drawn in `--frame`. Because
   `--frame` flips between ink and cream with the theme, every shadow inverts for free; a shadow
   hard-coded to a hex value will look wrong in one theme.

Dark mode overrides a subset of those under `[data-theme="dark"]`. [`AppThemeProvider.tsx`](../modules/providers/AppThemeProvider.tsx) configures
next-themes with `attribute='data-theme'`, so the attribute lands on `<html>`.

`theme/index.css` is the bridge from tokens to utility classes. `@theme inline` matters: the generated
theme variable holds `var(--background)` rather than a resolved colour, so the `[data-theme="dark"]`
overrides propagate into `bg-background`, `text-muted-foreground`, `rounded-lg` and the rest at
runtime. A token added to `global/index.css` is invisible to Tailwind until it is also mapped here.

Fonts come from [`fonts.ts`](../../app/fonts.ts) (next/font), which exposes `--font-space-grotesk`, `--font-bricolage`,
`--font-instrument-serif` and `--font-jetbrains-mono`; `theme/index.css` maps them onto
`--font-sans`, `--font-display`, `--font-serif` and `--font-mono`. Adding a family means editing both.

## Custom variants

- `@custom-variant hover (&:hover)` **replaces** Tailwind v4's built-in `hover`, which wraps the rule
  in `@media (hover: hover)`. With the override, `hover:` utilities also apply on coarse pointers. It
  reads like a no-op redefinition; it is not.
- `@custom-variant dark (&:is([data-theme="dark"] *))` matches *descendants* of the themed element
  only. Since `data-theme` is set on `<html>`, `dark:` utilities never apply to `<html>` itself, so
  style the root through the token overrides in `global/index.css` instead.

## quiet-link

The nav-and-footer link treatment: a transparent 3px border that fills with `--accent` and `--frame` on
hover, over 75ms. It was written out by hand **eleven times** — six in [`Footer.tsx`](../modules/shared/footer/Footer.tsx) alone, plus
`ContactButton`, `CookieButton`, `Navigation`, `Faq` and the planner's `Contact` — as a 190-character class
string, and [`Faq.tsx`](../modules/pages/homepage/sections/Faq.tsx) had already started fixing it locally by hoisting the string to a module const, which
made a seventh place for the value to live.

It is a `@utility` rather than a `Button` variant because only three of the eleven sites are `Button`s. The
rest are the locale-aware `Link` and `createRichLink`, so a CVA variant would have covered a third of them
and left the string in the other two thirds.

**Three differences between the call sites survived on purpose, and one of them is real drift.** `h-auto`
appears only on the `Button` sites, which is correct: `Button` sets a height and `Link` does not.
`Navigation` uses `px-2 py-1` where everyone else uses `px-1.5 py-0.5`, plausibly because the top nav wants
a larger target. But the font weight genuinely disagrees: four sites say `font-medium` and three say
`font-semibold`, and nothing distinguishes them. Picking one is a design decision with visible output, not a
refactor, so it was left alone rather than flattened inside a change that moves no pixels.

## hit-area-stable

An element that lifts on hover (`hover:-translate-x-0.5 hover:-translate-y-0.5`, used all over the
neo-brutalist primitives) can move out from under the cursor: the pointer leaves, the transform
reverts, the element slides back under the pointer, and the hover state oscillates. `hit-area-stable`
pins the hit area while the box moves, using a transparent `::after` at `inset: 0` behind the element
(`z-index: -1`) that grows into the vacated space on `:hover` (`inset: 0 -8px -8px 0`) and on
`:active` (`inset: -8px 0 0 -8px`, mirrored because the press moves the box the other way).

**Add it to any element you give a `hover:-translate-*`.** Current users include [`Button.tsx`](../modules/core/primitives/Button.tsx),
[`Badge.tsx`](../modules/core/primitives/Badge.tsx), [`Slider.tsx`](../modules/core/primitives/Slider.tsx), the animate primitives ([`Accordion.tsx`](../modules/core/animate/base/Accordion.tsx), [`Collapsible.tsx`](../modules/core/animate/base/Collapsible.tsx), [`Dialog.tsx`](../modules/core/animate/base/Dialog.tsx),
[`Sidebar.tsx`](../modules/core/animate/base/Sidebar.tsx), [`Tooltip.tsx`](../modules/core/animate/base/Tooltip.tsx)), the planner calendar day cells and the homepage sections.

`hit-area-stable-tilt` is the variant for elements that *rotate* on hover rather than translate
(`rotate-[-1deg]` → `hover:rotate-0`, in [`Pricing.tsx`](../modules/pages/homepage/sections/Pricing.tsx) and [`Testimonials.tsx`](../modules/pages/homepage/sections/Testimonials.tsx)). A rotation moves all
four edges, so its hover inset is symmetric (`inset: -16px`) and it has no `:active` case.

Both set `position: relative` through `:where(&)`, which contributes zero specificity, so a component
can still set its own positioning without `!important`.

The same trick is hand-written for the driver.js buttons in `lazy/index.css`, because an `@utility` cannot be
applied to markup a library owns, and that file is compiled on its own without importing Tailwind, so
`@apply` has nothing to resolve either. A comment there names this utility as the thing the copy must
track; change the insets here and the copy will not follow.

## Biome formats all of these folders

Biome's CSS parser rejects Tailwind-only at-rules by default: `@apply` in `base/`, `@theme inline` and
`@custom-variant` in `theme/`, `@utility` in `utilities/` all parse as errors, and a parse error aborts
formatting for the whole file. [`biome.json`](../../../../../biome.json) used to answer that by excluding those three folders from
`files.includes`, which gates the *whole* tool: they fell out of `pnpm format:all` and `pnpm lint:all`
alike, and their formatting drifted apart, with `utilities/index.css` on single quotes and `theme/index.css`
on CRLF.

The exclusion is gone. `biome.json` sets `css.parser.tailwindDirectives: true` instead, which teaches
the parser those at-rules, so every file in this folder is formatted and linted like any other. Double
quotes throughout, LF, 120 columns: Biome's defaults, applied by the tool rather than by hand.

## Gotchas

- `base/index.css` gives every `section[id]` `content-visibility: auto` with
  `contain-intrinsic-size: auto 800px`. Off-screen sections are not laid out, so anything that
  measures a section before it scrolls into view reads the 800px placeholder, not the real height.
- `body` paints `--page-glow` with `background-attachment: fixed`, so the glow does not scroll with
  the content. Setting `background` (rather than `background-color`) anywhere on `body` wipes it.
- `vendor/index.css` hides `#cc-main` with `display: none !important`. `vanilla-cookieconsent` still
  runs and still owns consent state; only its UI is suppressed, because the app renders its own
  [`CookieConsentDialog.tsx`](../modules/shared/cookie-consent/CookieConsentDialog.tsx). Do not "fix" this by disabling the library.
- `[data-boneyard] > div:not([data-boneyard-overlay]) { display: contents }` unwraps the boneyard-js
  skeleton wrapper so it does not break the grid or flex layout it sits inside.
- `--container-8xl` in `theme/index.css` exists for one class, `max-w-8xl` in `planner/page.tsx`.
  Tailwind resolves `max-w-*` from `--max-width-*`, then `--spacing-*`, then `--container-*`, so the
  `--max-width-8xl` mirror that used to sit beside it was shadowing an identical value and has been
  removed. Deleting `--container-8xl` as well would silently drop the class.

## Testing

`index.test.ts` is the only test here, and it reads CSS as text rather than rendering anything. It
pins the two things that look like tidy-ups and are not: the design tokens stay unlayered and the
layer statement reserves no slot for them, and `theme/index.css` keeps `--container-8xl` without a
`--max-width-8xl` mirror.

Nothing else is asserted. In particular, nothing checks that a new `hover:-translate-*` carries
`hit-area-stable`, or that the driver.js copy of it in `lazy/index.css` still matches. Both are

review-time obligations.

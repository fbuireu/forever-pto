# src/ui/modules/core

## Purpose

The design system: the visual vocabulary every screen is built from. Components here take strings and
callbacks as props and know nothing about Suggestions, Holidays or Premium. It is the one folder
[`modules/CLAUDE.md`](../CLAUDE.md) allows everything else to import, and — with the exceptions listed
under *Layer rules* — the one folder that imports nothing back.

## Structure

Two stacks share the folder: the flat `primitives/`, and the three-deep `animate/` tower where
`animate/primitives/` wraps the headless library, `animate/base/` styles and animates those wrappers,
and `animate/components/` composes them. Knowing which layer you are editing tells you how far the
change reaches.

| Folder | Contents |
| --- | --- |
| `primitives/` | The plain layer: `Button.tsx`, `Card.tsx`, `Badge.tsx`, `Input.tsx`, `Textarea.tsx`, `Label.tsx`, `Table.tsx`, `Separator.tsx`, `Banner.tsx`, `Form.tsx` (react-hook-form context), `InputGroup.tsx`, `Command.tsx` (cmdk), `Combobox.tsx`, `FlagIcon.tsx`, `Progress.tsx`, `Slider.tsx`, `Sonner.tsx` (the toaster), `RichLink.tsx`. Plus `primitives/utils/helpers.ts` — one predicate, `hasFlag` |
| `animate/primitives/` | Unstyled wrappers over `@base-ui/react`, the bottom of the animated stack: `animate/primitives/base/Dialog.tsx`, `Popover.tsx`, `Tooltip.tsx`, `Switch.tsx`; `animate/primitives/animate/MotionSlot.tsx`; `animate/primitives/texts/Rotating.tsx` |
| `animate/base/` | The styled, motion-aware components built on the layer above or directly on `@base-ui/react`: `Accordion.tsx`, `Checkbox.tsx`, `Collapsible.tsx`, `Dialog.tsx`, `DropdownMenu.tsx`, `Popover.tsx`, `Tooltip.tsx`, `Sidebar.tsx`, plus `animate/base/Drawer.tsx` (vaul) and `animate/base/Slot.tsx` |
| `animate/components/` | Compositions with their own behaviour: `Counter.tsx`, `Tabs.tsx`, `FeatureList.tsx`, `RadialNav.tsx` |
| `animate/effects/` | `AutoHeight.tsx` and `MotionHighlight.tsx` — behaviour applied to someone else's children |
| `animate/icons/` | 22 animated SVG icons plus `animate/icons/Icon.tsx`, which exports `AnimateIcon`, `IconWrapper` and `useVariants`. Excluded from the coverage report; `Icon.tsx` beside them is tested |
| `animate/text/` | `SlidingNumber.tsx` and `animate/text/Rotating.tsx` |
| `animate/providers/` | `LazyMotionProvider.tsx` — a nine-line `LazyMotion` wrapper, mounted once in the locale layout |

There is no `Switch` in `primitives/`; the only one is `animate/primitives/base/Switch.tsx`.

## Conventions

- **Named exports only.** No `default` anywhere in this folder, and no barrel `index.ts` — import the
  module directly.
- **`cn()` on every className seam.** `@ui/utils/cn` merges Tailwind classes so a caller's `className`
  overrides the component's rather than fighting it.
- **`data-slot` on composition sub-parts** (`Card`, `Form`, `InputGroup`, `Table`), so a parent can
  reach a specific part without a class-name contract.
- **`asChild` via `animate/base/Slot.tsx`**, which merges props with `mergeProps` from
  `@base-ui/react/merge-props` and composes refs. `Button`, `Badge` and `Form` use it. Do not write
  another one. The motion equivalent is `MotionSlot`.
- **Design tokens, not literals.** 3px frames (`border-[3px] border-[var(--frame)]`), the
  `--shadow-brutal-*` scale and `--color-brand-*` are all defined in `src/ui/styles/global/index.css`;
  `hit-area-stable` is a Tailwind `@utility` in `src/ui/styles/utilities/index.css`. See
  [`styles/CLAUDE.md`](../../styles/CLAUDE.md).

**CVA is not the rule.** Only four files use `class-variance-authority` — `Button.tsx`, `Badge.tsx`,
`InputGroup.tsx` and `animate/base/Sidebar.tsx` — and only `buttonVariants` and `badgeVariants` are
exported. Everything else is a plain `cn()` call, and `Banner.tsx` and the planner's `MetricCard`
instead take a `colorScheme` key into a local `COLOR_SCHEMES` record. Reach for CVA when a component
genuinely has orthogonal variant axes; a single `variant` prop with four values does not need it.

## Layer rules

The accessibility primitive is **`@base-ui/react`**, not Radix — no Radix package is installed. Motion
comes from `motion` (`motion/react`), with `vaul` for the drawer, `cmdk` for the command palette,
`sonner` for toasts and `lucide-react` for static icons.

**Import `m`, never `motion`.** Every animated file in this folder imports `m` from `motion/react`
because the app wraps everything in `LazyMotionProvider`, which loads `domAnimation` on demand. A
`motion.div` re-introduces the full feature bundle that the provider exists to defer. There is not a
single `motion.` usage in `src/ui` today; keep it that way. Nearly everything here ships to the
browser — the planner runs there end to end
([ADR 0001](../../../../docs/adr/0001-planner-runs-in-the-browser.md)) — so a dependency added in this
folder is a dependency added to the client bundle of every screen.

Coupling back into the rest of the app is small, but it is not zero. The complete list:

- `@ui/hooks/*` is fair game — `useControlledState.tsx`, `useIsInView.tsx`, `useAutoHeight.tsx`,
  `useMobile.ts`. These are generic React utilities, not product state.
- `animate/base/Sidebar.tsx` writes the `sidebar_state` cookie through `@ui/utils/cookie`, and exports
  `SIDEBAR_COOKIE_NAME` so the server layout can read the same key.
- `animate/text/SlidingNumber.tsx` calls `useLocale()` to pick the decimal separator. It is the only
  `next-intl` import here, and it reads the locale rather than any copy.
- `primitives/RichLink.tsx` imports the locale-aware `Link` from `@application/i18n/navigation`,
  because an internal link that skipped the locale prefix would be a bug wherever it was written.
- `primitives/utils/helpers.ts` imports `CountryDTO` and `RegionDTO` for its `hasFlag` predicate. It is
  the last of that coupling: `primitives/Combobox.tsx` is generic over its option value, so the
  country, region, Strategy and month pickers each keep their own value type. Widen the generic before
  reusing it elsewhere; do not pull a third DTO in.

No component here calls `useTranslations` or touches a Zustand store, and that line should hold.

## Gotchas

**The dialog lives in `animate/base/Dialog.tsx` and nowhere else.** `primitives/` used to carry a
pure re-export of it; the seven callers now import the implementation directly. Do not reintroduce a
re-export — the no-barrel convention has no exception here.

**There are two `Rotating.tsx` files and they are different components.**
`animate/text/Rotating.tsx` exports `RotatingText`, a self-contained `AnimatePresence` cycle over a
string array — that is the one `pages/planner/Summary.tsx` uses. `animate/primitives/texts/Rotating.tsx`
exports only `RotatingTextContainer`, a context provider with no visual output. `shared/footer/components/DevFooter.tsx`
imports one from each and nests them. Check the import path before assuming which you have.

**`animate/primitives/` is reachable from outside, and is reached.** Nothing there is styled, so it
was meant to stay internal to `animate/`, but `Switch` has no wrapper in `animate/base/` and so
`sidebar/components/AllowPastDays.tsx` and `shared/cookie-consent/CookieConsentDialog.tsx` both import
it directly. Giving Switch a styled wrapper in `animate/base/` is the fix; importing from
`animate/primitives/` for anything else is not.

**`IconWrapper` still drops `persistOnAnimateEnd` when there is no parent context.** The two context
values in `animate/icons/Icon.tsx` carry it, so a parent `AnimateIcon` reaches a nested icon, but the
context-free branch of `IconWrapper` builds its `AnimateIcon` without `persistOnAnimateEnd` or
`initialOnAnimateEnd` — on a standalone icon both are inert. Nothing passes them today.

**`primitives/Slider.tsx` exists to pin the value type.** `@base-ui/react` hands its `onValueChange`
and `onValueCommitted` callbacks a `number | readonly number[]`; every caller in this app wants a
mutable `number[]`, so the wrapper copies the array or boxes the lone number before calling back.
Widening the prop type instead would push that fork into each caller.

**`RadialNav`'s `orbitRadius` is `size / 2 - 0.5`, and the half pixel is not slop.** It puts the
*centre* of each item circle on the parent circle's stroke rather than outside it: the parent radius
less half the border the child draws. Drop the `0.5` and the ring stops reading as concentric.

**`MotionSlot` calls `m.create(children.type)` inside `useMemo`, keyed on the child's type.** A child
whose component identity changes between renders — anything defined inline — remints the motion
component every render and drops the animation state. Define the child at module scope.

## Testing

Vitest with `happy-dom`, co-located `*.test.tsx`. Coverage here is deliberately lopsided and a missing
test is usually a decision rather than an omission:

- `animate/base/` is covered file for file, and so are `animate/components/`, `animate/effects/`,
  `animate/text/SlidingNumber.tsx` and `animate/primitives/base/Tooltip.tsx`. These carry state
  machines, controlled/uncontrolled fallbacks and event composition — the parts that break silently.
- `primitives/` has **no tests at all**. Those files are markup plus `cn()`; the Playwright suite in
  `e2e/` is what proves they render.
- `animate/icons/**` is excluded from both the run and the coverage report in `vitest.config.ts`. They
  are mechanical wrappers around SVG path data — but `animate/icons/Icon.tsx` is not, and the
  exclusion swallows its co-located `Icon.test.tsx` with the rest of the folder. Until the glob spares
  that one file, run it with a config whose `include` names it.

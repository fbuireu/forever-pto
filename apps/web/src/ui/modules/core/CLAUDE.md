# apps/web/src/ui/modules/core

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
| `animate/primitives/` | Unstyled wrappers over `@base-ui/react`, the bottom of the animated stack, and internal to `animate/`: `animate/primitives/base/Dialog.tsx`, `Popover.tsx`, `Tooltip.tsx`; `animate/primitives/animate/MotionSlot.tsx` |
| `animate/base/` | The styled, motion-aware components built on the layer above or directly on `@base-ui/react`: `Accordion.tsx`, `Checkbox.tsx`, `Collapsible.tsx`, `Dialog.tsx`, `DropdownMenu.tsx`, `Popover.tsx`, `Tooltip.tsx`, `Sidebar.tsx`, plus `animate/base/Drawer.tsx` (vaul) and `animate/base/Slot.tsx` |
| `animate/components/` | Compositions with their own behaviour: `Counter.tsx`, `Tabs.tsx`, `FeatureList.tsx`, `RadialNav.tsx` |
| `animate/effects/` | `AutoHeight.tsx` and `MotionHighlight.tsx` — behaviour applied to someone else's children |
| `animate/icons/` | 22 animated SVG icons plus `animate/icons/Icon.tsx`, which exports `AnimateIcon`, `IconWrapper` and `useVariants`. Excluded from the coverage report; `Icon.tsx` beside them is tested |
| `animate/text/` | `SlidingNumber.tsx` and `animate/text/Rotating.tsx` |
| `animate/providers/` | `LazyMotionProvider.tsx` — a nine-line `LazyMotion` wrapper, mounted once in the locale layout |

There is no `Switch` in `primitives/`; the only one is `animate/base/Switch.tsx`.

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
([ADR 0001](../../../../../../adr/0001-planner-runs-in-the-browser.md)) — so a dependency added in this
folder is a dependency added to the client bundle of every screen.

Coupling back into the rest of the app is small, but it is not zero. The complete list:

- `@ui/hooks/*` is fair game — `useControlledState.tsx`, `useIsInView.tsx`, `useAutoHeight.tsx`,
  `useMobile.ts`. These are generic React utilities, not product state.
- `animate/base/Sidebar.tsx` writes the `sidebar_state` cookie through `@ui/utils/cookie` and reads it back
  from `document.cookie` on mount. It exports `SIDEBAR_COOKIE_NAME`, and **nothing in this package imports
  it** — no server layout reads the cookie and passes a `defaultOpen`, so the rail always renders expanded
  and then collapses once the effect runs. Either wire the layout up or stop describing the export as
  shared; what is not true today is that anything in `apps/web` uses the key. The docs site does: two wiki
  pages import it to document the cookie's name, which is also why `temporal-polyfill` ends up in the docs
  dependency list to render a string. This bullet said "nothing outside that file" until that reach was
  derived mechanically — the seam is invisible from this side, which is the reason to check rather than
  assert.
- `animate/text/SlidingNumber.tsx` calls `useLocale()` to pick the decimal separator. It is the only
  `next-intl` import here, and it reads the locale rather than any copy.
- `primitives/RichLink.tsx` imports the locale-aware `Link` from `@application/i18n/navigation`,
  because an internal link that skipped the locale prefix would be a bug wherever it was written.
- `primitives/utils/helpers.ts` imports `CountryDTO` and `RegionDTO` for its `hasFlag` predicate. It is
  the last of that coupling: `primitives/Combobox.tsx` is generic over its option value, so the
  country, region, Strategy and month pickers each keep their own value type. Widen the generic before
  reusing it elsewhere; do not pull a third DTO in.

No component here calls `useTranslations` or touches a Zustand store, and that line should hold.

**That rule makes a hard-coded accessible name a defect, not a shortcut.** A component in this folder cannot
translate, so a literal `aria-label` or `sr-only` string ships one language to screen-reader users on all six
locales — and it is invisible to everyone testing visually. Four of them shipped that way: `Dialog`'s close
button said "Close" on every modal in the app, `SidebarTrigger` said "Toggle Sidebar", `Sidebar`'s mobile
landmark said "Sidebar" and `RadialNav` said "Radial navigation". Each now takes the string as a prop —
`closeLabel`, `label`, `landmarkLabel`, `aria-label` — keeping the English literal as the default so a caller
that forgets degrades to what it said before rather than to nothing. The callers pass the `a11y` namespace;
see [`../../i18n/CLAUDE.md`](../../i18n/CLAUDE.md). A brand name is the one thing that stays literal:
`aria-label='Forever PTO'` is correct in every locale.

**`RadialNav` accepts `HTMLAttributes` and spreads none of them.** It destructures what it uses and drops the
rest, so `aria-label` had to be named explicitly to be honoured at all. Anything else a caller passes —
`id`, `data-*`, a handler — is silently discarded today. Widen the destructure rather than assuming the
prop arrives.

## Gotchas

**`Tooltip` only mints a `TooltipProvider` when it is given a delay of its own.** It used to mint one
unconditionally, defaulting to `delay = 0` — and since `TooltipTrigger` resolves `delay ?? use(TooltipDelayContext)`
from the *nearest* provider, and a trigger is always inside a `Tooltip`, that inner provider shadowed every
outer one. The `delayDuration={200}` written at all ten call sites, `SidebarProvider` included, was dead:
every tooltip in the app opened instantly, not even at Base UI's own default. `Tooltip` now renders the
primitive bare unless a `delay`/`delayDuration` is passed to it directly, so the nearest enclosing
`TooltipProvider` is the one that counts. A component in this layer that wraps its subtree in a context
provider has to ask whether it is overriding one the caller set.

**There is no app-wide tooltip provider, and 200 ms is `TooltipProvider`'s own default.** The root layout
mounts `BonesProvider`, `NextIntlClientProvider`, `AppThemeProvider` and `LazyMotionProvider` and no tooltip
one, so every tooltip depends on a provider some ancestor happened to mint. All ten of those wrote
`delayDuration={200}` by hand; the default carries it now and the call sites say nothing. Passing a delay
still overrides it, which is what `Tooltip.test.tsx` pins.

**`utils/cookie.ts` feature-detects the Cookie Store API and falls back to `document.cookie`.** The bare
`cookieStore` global does not exist in Firefox, in Safari before 18.4, or in any insecure context, so the
write threw a `ReferenceError` that `SidebarProvider.setOpen`'s `.catch(() => {})` swallowed — the sidebar
silently forgot its collapsed state on every reload in those browsers, with nothing logged. The `typeof`
guard is the same shape the root guide mandates for `window` and `document`, and for the same reason: a bare
identifier that is not defined throws rather than evaluating to `undefined`. `cookie.test.ts` stubs the
global in its `beforeEach`, which is exactly what hid this, so the fallback has its own block that stubs it
away.

**The dialog lives in `animate/base/Dialog.tsx` and nowhere else.** `primitives/` used to carry a
pure re-export of it; the seven callers now import the implementation directly. Do not reintroduce a
re-export — the no-barrel convention has no exception here.

**There is one `Rotating.tsx` now, and there used to be two.** `animate/text/Rotating.tsx` exports
`RotatingText`, a self-contained `AnimatePresence` cycle over a string array, and it supplies its own
`overflow-hidden py-1` wrapper. A second file under `animate/primitives/texts/` exported `RotatingTextContainer`,
described here as "a context provider with no visual output" — it was the opposite on both counts. It built
its context with `const [RotatingTextProvider] = getStrictContext(…)`, discarding the consumer hook, and
**nothing in `src/` ever read that context**; its only output was a redundant `div`. So its `useIsInView`
subscription and its `setTimeout`+`setInterval` cycle re-rendered the footer forever while changing nothing
on screen. `DevFooter` nested one inside the other and drove the emoji from a *third* interval of its own —
random, not sequential, which is why it does not simply pass `EMOJIS` to `RotatingText` now. Deleting the
container left the render identical.

**`animate/primitives/` is internal to `animate/`, and that is now true rather than aspirational.** It had
three importers from outside. One was the no-op above. The other two took `Switch` — which was never an
unstyled wrapper: it carried the full `border-[3px] border-[var(--frame)]` and `--shadow-brutal-3` treatment,
so it was misfiled rather than merely leaked. It lives in `animate/base/Switch.tsx` now beside `Checkbox` and
`Collapsible`, its two styled siblings, and it has the co-located test they have. The folder has zero
external importers; keep it that way, and promote rather than reach in.

`Switch`'s context was the same shape as the one above on a smaller scale: it published `isChecked`,
`setIsChecked`, `isPressed` and `setIsPressed`, and `SwitchThumb` — the only consumer — reads `isPressed`
alone. It carries `isPressed` and nothing else now. Note when reading its test that the controlled/
uncontrolled behaviour is enforced *twice*: `useControlledState` and `SwitchPrimitives.Root`'s own `checked`
prop both do it, so removing either one alone leaves the suite green. `useControlledState` earns its place
for `onCheckedChange`, not for the rendered state.

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
- `primitives/` has **no tests at all**. Those files are markup plus `cn()`, and the Playwright suite in
  `e2e/` only proves the pages holding them render — see [`../CLAUDE.md`](../CLAUDE.md) for what those specs
  actually assert, which is less than the word "covered" suggests.
- `animate/icons/` is excluded from the **coverage report** only, and the glob already spares `Icon.tsx`.
  The 22 icons are mechanical wrappers around SVG path data; `Icon.tsx` is not, and its co-located
  `Icon.test.tsx` runs with everything else. Nothing under `core/` is excluded from the test run.

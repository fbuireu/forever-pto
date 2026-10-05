# apps/web/src/ui/modules/core

## Purpose

The design system: the visual vocabulary every screen is built from. Components here take strings and
callbacks as props and know nothing about Suggestions, Holidays or Premium. Every other folder under
[`modules/`](../AGENTS.md) imports it, and it imports back only what *Layer rules* lists.

## Structure

Two stacks share the folder: the flat `primitives/`, and the layered `animate/` tower where
[`animate/primitives/`](./animate/primitives) wraps the headless library, [`animate/base/`](./animate/base) styles and animates those wrappers,
and [`animate/components/`](./animate/components) composes them. Knowing which layer you are editing tells you how far the
change reaches.

`components.json` holds shadcn's own configuration and names no third-party registry: `animate/` is this project's
code, so a component from Animate UI is ported by hand rather than added over a local file.

| Folder | Contents |
| --- | --- |
| `primitives/` | The plain layer: [`Button.tsx`](./primitives/Button.tsx), [`Card.tsx`](./primitives/Card.tsx), [`Badge.tsx`](./primitives/Badge.tsx), [`Input.tsx`](./primitives/Input.tsx), [`Textarea.tsx`](./primitives/Textarea.tsx), [`Label.tsx`](./primitives/Label.tsx), [`Table.tsx`](./primitives/Table.tsx), [`Separator.tsx`](./primitives/Separator.tsx), [`Banner.tsx`](./primitives/Banner.tsx), [`Form.tsx`](./primitives/Form.tsx) (react-hook-form context), [`InputGroup.tsx`](./primitives/InputGroup.tsx), [`NumberInput.tsx`](./primitives/NumberInput.tsx) (Base UI's `NumberField` drawn as an `Input`), [`Command.tsx`](./primitives/Command.tsx) (cmdk), [`Combobox.tsx`](./primitives/Combobox.tsx), [`FlagIcon.tsx`](./primitives/FlagIcon.tsx), [`Progress.tsx`](./primitives/Progress.tsx), [`Slider.tsx`](./primitives/Slider.tsx), [`Sonner.tsx`](./primitives/Sonner.tsx) (the toaster), [`RichLink.tsx`](./primitives/RichLink.tsx), [`Bone.tsx`](./primitives/Bone.tsx) (the placeholder block every `*Fixture.tsx` draws with). Plus [`primitives/utils/helpers.ts`](./primitives/utils/helpers.ts): one predicate, `hasFlag` |
| `animate/primitives/` | Unstyled wrappers, the bottom of the animated stack and internal to `animate/`: [`animate/primitives/base/Dialog.tsx`](./animate/primitives/base/Dialog.tsx) and `Popover.tsx` over `@base-ui/react`, `Tooltip.tsx` over Base UI's popover so a tap opens it as well as a hover; [`animate/primitives/animate/MotionSlot.tsx`](./animate/primitives/animate/MotionSlot.tsx) |
| `animate/base/` | The styled, motion-aware components built on the layer above or directly on `@base-ui/react`: [`Accordion.tsx`](./animate/base/Accordion.tsx), [`Checkbox.tsx`](./animate/base/Checkbox.tsx), [`Collapsible.tsx`](./animate/base/Collapsible.tsx), `Dialog.tsx`, [`DropdownMenu.tsx`](./animate/base/DropdownMenu.tsx), [`Popover.tsx`](./animate/base/Popover.tsx), [`Switch.tsx`](./animate/base/Switch.tsx), [`Tooltip.tsx`](./animate/base/Tooltip.tsx), [`Sidebar.tsx`](./animate/base/Sidebar.tsx), plus [`animate/base/Drawer.tsx`](./animate/base/Drawer.tsx) (vaul) and [`animate/base/Slot.tsx`](./animate/base/Slot.tsx) |
| `animate/components/` | Compositions with their own behaviour: [`Counter.tsx`](./animate/components/Counter.tsx), [`Tabs.tsx`](./animate/components/Tabs.tsx), [`FeatureList.tsx`](./animate/components/FeatureList.tsx), [`RadialNav.tsx`](./animate/components/RadialNav.tsx) |
| [`animate/effects/`](./animate/effects) | [`AutoHeight.tsx`](./animate/effects/AutoHeight.tsx) and [`MotionHighlight.tsx`](./animate/effects/MotionHighlight.tsx): behaviour applied to someone else's children |
| [`animate/icons/`](./animate/icons) | 22 animated SVG icons plus [`animate/icons/Icon.tsx`](./animate/icons/Icon.tsx), which exports `AnimateIcon`, `IconWrapper`, `useAnimateIconContext`, `useVariants` and the `IconProps` type. The icons are left out of the coverage report, not the test run; `Icon.tsx` is covered |
| [`animate/text/`](./animate/text) | [`SlidingNumber.tsx`](./animate/text/SlidingNumber.tsx) and [`animate/text/Rotating.tsx`](./animate/text/Rotating.tsx) |
| [`animate/providers/`](./animate/providers) | [`LazyMotionProvider.tsx`](./animate/providers/LazyMotionProvider.tsx): `LazyMotion` around `MotionConfig reducedMotion="user"`, mounted once per render root |

There is no `Switch` or `Dialog` in `primitives/`: both live in `animate/base/`.

## Shared mechanisms

- **`RichLink` replaces a received `className`** rather than merging it through `cn()` (`@ui/utils/cn`): a
  `className` replaces its `text-primary hover:underline` default.
- **`animate/base/Slot.tsx` is the `asChild` mechanism**: it merges props with `mergeProps` from
  `@base-ui/react/merge-props` and composes refs. `Button`, `Badge`, `FormControl` and the sidebar's group
  label and menu button use it; `MotionSlot` is the motion equivalent.
- The 3px frames (`border-[3px] border-[var(--frame)]`), the `--shadow-brutal-*` scale and `--color-brand-*`
  are defined in [`src/ui/styles/global/index.css`](../../styles/global/index.css); `hit-area-stable` is a
  Tailwind `@utility` in [`src/ui/styles/utilities/index.css`](../../styles/utilities/index.css). See
  [`styles/AGENTS.md`](../../styles/AGENTS.md).

Only `Button.tsx`, `Badge.tsx`, `InputGroup.tsx` and `animate/base/Sidebar.tsx` use
`class-variance-authority`, and only `buttonVariants` and `badgeVariants` are exported. `Banner.tsx` and the
planner's `MetricCard` take a `colorScheme` key into a local `COLOR_SCHEMES` record instead.

## Layer rules

The accessibility primitive is **`@base-ui/react`**. No Radix package is a direct dependency: `vaul` and `cmdk`
bring `@radix-ui/react-dialog` in transitively, which is the dialog the `vaul` patch below reaches. Motion comes
from `motion` (`motion/react`), with `vaul` for the drawer, `cmdk` for the command palette, `sonner` for toasts,
`lucide-react` for static icons, `react-hook-form` under `Form`, `react-use-measure` under `SlidingNumber` and
`next-themes` for the toaster's theme.

`LazyMotionProvider` loads `domAnimation` on demand. Nearly everything here ships to the browser: the
planner runs there end to end ([ADR 0001](../../../../../../adr/0001-planner-runs-in-the-browser.md)), so a
dependency added in this folder is a dependency added to the client bundle of every screen.

Coupling back into the rest of the app is small, but it is not zero. The complete list:

- `@ui/hooks/*` and the generic `@ui/utils` helpers: [`useControlledState.tsx`](../../hooks/useControlledState.tsx), [`useIsInView.tsx`](../../hooks/useIsInView.tsx), [`useAutoHeight.tsx`](../../hooks/useAutoHeight.tsx),
  [`useMobile.ts`](../../hooks/useMobile.ts), `cn` and [`context.tsx`](../../utils/context.tsx)'s `getStrictContext` (`Switch`, `Progress` and
  the three `animate/primitives/base` wrappers). None of them holds product state.
- `animate/base/Sidebar.tsx` writes the `sidebar_state` cookie through [`@ui/utils/cookie`](../../utils/cookie.ts), swallowing a
  failed write, and reads it back from `document.cookie` after mount. No server layout passes a `defaultOpen`,
  so the rail renders expanded and collapses once that effect runs. Nothing in [`apps/web`](../../../..) imports
  `SIDEBAR_COOKIE_NAME`; the wiki's `reference/cookies.mdx` and `patterns/reference-components.mdx` do, so
  renaming it breaks the docs build.
- `animate/text/SlidingNumber.tsx` calls `useLocale()` to pick the decimal separator. It is the only
  `next-intl` import here, and it reads the locale rather than any copy.
- `primitives/RichLink.tsx` imports the locale-aware `Link` from `@application/i18n/navigation`,
  because an internal link that skipped the locale prefix would be a bug wherever it was written.
- `primitives/utils/helpers.ts` imports `CountryDTO` and `RegionDTO` for `hasFlag`, the only DTO-typed code
  here: `primitives/Combobox.tsx` is generic over its option value. Widen `hasFlag` before reusing it; do not
  pull a third DTO in.

**The wiki renders these components, typed against them.** Its demos under `apps/docs/src/components/demos`
import the real exports and props, so a renamed export or prop fails `pnpm typecheck` (the `astro check` leg) or
the docs build. A new file under `animate/icons/` also goes into
[`IconsGalleryDemo.tsx`](../../../../../docs/src/components/demos/IconsGalleryDemo.tsx) in the same change, or
`pnpm test:docs` fails; the gallery imports each icon by its export name, and `PanelLeft.tsx` exports
`PanelLeftIcon` while `Search.tsx` also exports `SearchIcon`.

**A component here cannot translate, so every accessible name is a prop.** Five props keep an English
default for a caller that passes nothing: `closeLabel` on `DialogContent` and on `Toaster` (sonner's own close
button is named in English), `label` on `SidebarTrigger`, `landmarkLabel` on `Sidebar` and `aria-label` on
`RadialNav`; every app caller passes a string from the `a11y` namespace, see
[`../../i18n/AGENTS.md`](../../i18n/AGENTS.md). Where the component would render a nameless control the name is
required and the compiler is the check:

- [`primitives/Label.tsx`](./primitives/Label.tsx) takes `htmlFor: string`, not the optional one `ComponentProps<'label'>` carries. It
  renders `children` itself rather than through the spread: spread children trip Biome's `noLabelWithoutControl`.
- [`animate/base/Switch.tsx`](./animate/base/Switch.tsx) and [`animate/base/Checkbox.tsx`](./animate/base/Checkbox.tsx) take `{ id } | { 'aria-label' } | { 'aria-labelledby' }`,
  intersected with their other props, because Base UI renders each as a `<button role>` with no name of its own.
  `Checkbox.test.tsx` pins the union with a type assignment, so loosening it fails `pnpm typecheck`. `id` names
  something only when a `<label htmlFor>` points at it.
- [`primitives/Slider.tsx`](./primitives/Slider.tsx) takes `label: string` and puts it on `Slider.Thumb`, which is where Base UI's
  real control, a nested `<input type='range'>`, lives. It takes no `id`: `Slider.Root` renders a `<div>`, so a
  `<label htmlFor>` pointing at it would name nothing.
- [`animate/components/Counter.tsx`](./animate/components/Counter.tsx) takes `decrementLabel` and `incrementLabel`, since its buttons show
  only `−` and `+`. Its `label` is the visible caption under the number, upper-cased by its own class, so a
  caller passes it in the bundle's case.

`TooltipInfoTrigger` renders an `aria-hidden` "i", so its `aria-label` is required, pinned by a type assignment in
`Tooltip.test.tsx`.
[`primitives/NumberInput.tsx`](./primitives/NumberInput.tsx) takes `roleDescription: string` and `locale: string`, both
required: Base UI's own `aria-roledescription` is the English "Number field", and a locale it was not given would be the
browser's, which the server cannot know, so each caller passes `a11y.numberField` and the route's locale.
`RadialNav` is a `<fieldset aria-label>` of `aria-pressed` buttons: it picks a category and navigates nowhere,
so it declares no `menu` role, and Biome's `useSemanticElements` wants the element over `role="group"`.

## Gotchas

**`Tooltip` mints a `TooltipProvider` only when it is given `delay` or `delayDuration`.** `TooltipTrigger` reads
its delay from the nearest provider, so an inner provider would shadow the one the caller set; any component here
that wraps its subtree in a context provider has the same question to answer. There is no app-wide tooltip
provider: `SidebarProvider`, `PremiumFeature`, `SidebarFieldLabel` and the planner calendar each mount the styled
one, whose default is `TOOLTIP_DELAY_MS` (200 ms), and a tooltip under none of them opens at once.
`Tooltip.test.tsx` pins both halves.

**`TooltipTrigger` is Base UI's popover trigger, so `asChild` must hand it a `<button>` or say it is none.** It
expects a native button and logs an error in development on anything else. A trigger that is only a hover target
inside a control passes `nativeButton={false}`, and with it `tabIndex={-1}` and `role="none"`, because Base UI
then makes the element a focusable `role="button"`: the collapsed rail's highlight wrapper in
[`animate/base/Sidebar.tsx`](./animate/base/Sidebar.tsx), whose menu button stays the one control. A trigger the
pointer can focus inside a control that reports on Enter is a real `<button>` out of the tab order instead, as
`PremiumFeature`'s lock is: a focused non-native trigger answers Enter with a click of its own, and the control
around it would report twice. The opposite error comes from a root rendered as `m.button` without `nativeButton`:
[`animate/base/Checkbox.tsx`](./animate/base/Checkbox.tsx) and [`animate/base/Switch.tsx`](./animate/base/Switch.tsx)
pass it, because Base UI's checkbox and switch default to a `<span>` and log an error in development on a button.

**`CollapsibleTrigger asChild` clones only a valid element.** [`animate/base/Collapsible.tsx`](./animate/base/Collapsible.tsx)
hands `children` to Base UI as `render` when `isValidElement(children)` holds and otherwise draws its own styled
`<button>` around them. A node a server component builds and passes down as a prop can reach the client component as a
lazy reference, which is not a valid element, so the first client pass wraps a `SidebarMenuButton` in a second button
that the server's markup does not have: nested buttons and a hydration mismatch, intermittent because the chunk may or
may not have arrived. Build the trigger in the client module that renders the `Collapsible` and give that module the
pieces it draws, an icon and a label, as [`sidebar/components/SidebarCollapsibleGroup.tsx`](../sidebar/components/SidebarCollapsibleGroup.tsx)
does; its test hands it a lazy icon and asserts one button.

**`SidebarProvider` is mounted exactly once, in `app/[locale]/(app)/planner/layout.tsx`.** A second one nested
inside it would give its subtree an independent `open` state that no other consumer sees. `Sidebar.test.tsx`
walks every `.tsx` under `src/` to assert the single mount site; it is the one test here that reads the rest of
the app, because the defect cannot be seen from inside this folder.

**`animate/base/Sidebar.tsx` writes nothing to `document.body`, and `Sidebar.test.tsx` fails on any
`document.body.style` in it.** The mobile drawer blocks the pointer with its own `fixed inset-0` backdrop. `vaul`
sets `document.body.style.pointerEvents = 'auto'` whenever a `modal={false}` drawer mounts (`pages/planner/ManagementBar.tsx`
keeps one mounted on mobile); that is the initial value and nothing undoes it.

**Layers:** desktop sidebar `z-10`; drawer overlay `z-50`; drawer panel and the mobile sidebar's backdrop and
panel `z-51`; the cookie banner (`shared/cookie-consent/CookieConsent.tsx`) `z-100`, above every page layer because
it must stay within reach until it is answered, and below the dialog its preferences open in; dialog backdrop and popup
`z-200`; popover and dropdown positioners `z-210`; tooltip positioner `z-220`. A popover or a tooltip opens from
whatever surface is under it, so it clears the highest one; `Popover.test.tsx` and `Tooltip.test.tsx` assert the
positioner beats `200`.

**`vaul` is patched to forward `modal` to the Radix `Dialog.Root` it wraps**
([`patches/vaul@1.1.2.patch`](../../../../../../patches/vaul@1.1.2.patch)). Unpatched, every drawer mounts a modal Radix
dialog, which sets `pointer-events: none` and `aria-hidden` on everything outside it; `ManagementBar` mounts its
drawer open before its content commits, so vaul's own `requestAnimationFrame` reset never undoes that and the
mobile planner stops answering taps. A vaul bump fails the install until the patch is regenerated; the root
guide's patched-dependencies gotcha owns the Renovate side.

**`DialogContent` never outgrows the screen.** Base UI locks the page's scroll while a modal is open, so the
popup caps itself at `100dvh` less the gutter and scrolls inside, with `overscroll-contain` keeping the scroll
from chaining to the locked page. The close button is
absolute inside the scrolling popup, so a header that runs under it reserves the room itself (the quick start's
step row carries `pr-10`). `Dialog.test.tsx` asserts the classes, and the homepage e2e finishes the quick start
from its longest step at a phone's viewport.

**`Switch` renders from Base UI's own `checked` and `defaultChecked`; its `useControlledState` only relays
`onCheckedChange`**, and `Switch.test.tsx` fails without the former. Its context carries `isPressed` for
`SwitchThumb` and nothing else.

**`primitives/Form.tsx` names in `aria-describedby` only parts that are on the page.** `FormDescription`
registers itself with its `FormItem` from an effect, which costs one extra render on a described field, and
`FormMessage` renders only when it has a body.

**`primitives/NumberInput.tsx` reads the text the field shows, and does not trust the number Base UI parsed from it.**
`NumberField` removes the group mark wherever it sits, so on the Spanish page it reads `2.5` as 25 and `2.50` as
250, which `type="number"` reads right. [`ReadingField`](./primitives/NumberInput.tsx) reports
`readLocalizedNumber` of `state.inputValue` in an effect on every change of that text, so the owner's `number | null`
is the reading of what the visitor sees (a lone mark that cannot be a group mark is a decimal point; `1.2.3` and `.`
read as `null`), and `onValueChange` vetoes the number Base UI would write when the field is left if it differs from
that reading. A veto leaves the text as typed, so the blur handler also redraws, which is when `NumberField` rewrites
the text from the held value: `2.5` becomes `2,5` in Spanish and text with no reading becomes empty. The wrapper
`div` is `display: contents` and Base UI's hidden `type="number"` mirror sits beside it, `position: fixed`, outside the
layout. Typed values are not clamped (`allowOutOfRange`); the arrow keys, Home and End clamp to `min` and `max` and snap
to `step` ([ADR 0021](../../../../../../adr/0021-numbers-a-visitor-types-are-localised-text-fields.md)).

**`primitives/Slider.tsx` exists to pin the value type.** `@base-ui/react` hands its callbacks a
`number | readonly number[]`; every caller wants a mutable `number[]`, so the wrapper copies the array or boxes
the lone number before calling back, and no caller forks on the shape.

**`primitives/Combobox.tsx` keys its `CommandItem` by `option.value` and carries the label in `keywords`, and
both halves are one decision.** cmdk hands `onSelect` the item's own `value`, which is the only thing
identifying the clicked row, so options sharing a label (Regions can) stay apart; cmdk also filters on `value`,
and `keywords={[option.label]}` is what keeps the search matching names rather than ISO codes.
[`Combobox.test.tsx`](./primitives/Combobox.test.tsx) goes red without either half.

**It hands back the option's own value unchanged; the comparison guarding that call stays case-insensitive.**
Country and Region codes arrive upper-case, but a stored Country may be the lower-cased one an older build wrote
or the `user-country` cookie supplies. `setCountry` clears the Region in the same `set`, so a strict compare
would wipe a visitor's Region when they re-picked their own Country.

**`RadialNav`'s `orbitRadius` is `size / 2 - 0.5`.** The half pixel puts the centre of each item circle on the
parent circle's stroke; drop it and the ring stops reading as concentric.

**`LazyMotionProvider` renders `<MotionConfig reducedMotion="user">` inside its `LazyMotion`.** The global
`prefers-reduced-motion` override in `src/ui/styles/animations/index.css` cannot reach motion, which animates
through the Web Animations API and inline styles. Every render root mounts the provider once
(`app/[locale]/layout.tsx`, `app/global-error.tsx`, `app/global-not-found.tsx`), and
[`animate/providers/LazyMotionProvider.test.tsx`](./animate/providers/LazyMotionProvider.test.tsx) drives motion's
`prefersReducedMotion` both ways.

**The mobile sidebar is not a Base UI `Dialog`, so it manages focus itself.** It focuses its panel on open,
returns focus to what held it on close, and closes on Escape from a window-level listener, because focus may
leave the drawer. It sets `aria-modal="false"` and traps no focus: its backdrop blocks the pointer, and a trap
and `aria-modal="true"` change together if it ever becomes modal. The desktop rail is
`<aside aria-label={landmarkLabel}>`, the label the mobile dialog takes too.

**`MotionSlot` calls `m.create(children.type)` inside `useMemo`, keyed on the child's type.** A child
whose component identity changes between renders (anything defined inline) remints the motion
component every render and drops the animation state.

**`AnimateIcon` touches its controls only while it is mounted.** A run is asynchronous and outlives the icon: its
cancelled branches still ask the controls for the first frame after an unmount, and motion's `controls.start()` and
`controls.set()` throw an invariant in development when the component that owns the controls is not mounted (a no-op
in production). `startAnim`, the one function every start goes through, returns unless `mountedRef` is set. A layout
effect sets it, so it flips in the commit phase where motion flips its own `hasMounted`; a `try`/`catch` around the
call would hide the same message when a caller really misuses the controls.
[`Icon.mounted.test.tsx`](./animate/icons/Icon.mounted.test.tsx) runs the real controls, which the mocked
[`Icon.test.tsx`](./animate/icons/Icon.test.tsx) cannot.

## Testing

Vitest with `happy-dom`, co-located `*.test.tsx`: every file has one but the 22 icons, which are path data
under `IconWrapper` and sit outside the coverage report.

- [`Combobox.test.tsx`](./primitives/Combobox.test.tsx) mocks `animate/base/Popover` the way
  [`animate/base/Popover.test.tsx`](./animate/base/Popover.test.tsx) mocks the Base UI primitives (the popup needs layout this
  environment does not have), and keeps `cmdk` real, because cmdk decides which string `onSelect` receives.
- **`Progress.test.tsx` composes the parts the way [`../pages/planner/PlannerPanel.tsx`](../pages/planner/PlannerPanel.tsx) does, and the
  obvious composition renders nothing.** `ProgressTrack` passes `{...props}` to `ProgressPrimitive.Track`
  *and* gives it an explicit `MotionIndicator` child, so JSX children win and anything a caller nests
  inside the track is silently dropped. `ProgressOverlayLabel` is a **sibling** of the track, not a child;
  writing it as a child is a test that renders an empty bar and asserts nothing.

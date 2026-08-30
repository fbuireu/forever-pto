# apps/web/src/ui/modules/core

## Purpose

The design system: the visual vocabulary every screen is built from. Components here take strings and
callbacks as props and know nothing about Suggestions, Holidays or Premium. It is the one folder
[`modules/CLAUDE.md`](../CLAUDE.md) allows everything else to import, and, with the exceptions listed
under *Layer rules*, the one folder that imports nothing back.

## Structure

Two stacks share the folder: the flat `primitives/`, and the three-deep `animate/` tower where
[`animate/primitives/`](./animate/primitives) wraps the headless library, [`animate/base/`](./animate/base) styles and animates those wrappers,
and [`animate/components/`](./animate/components) composes them. Knowing which layer you are editing tells you how far the
change reaches.

| Folder | Contents |
| --- | --- |
| `primitives/` | The plain layer: [`Button.tsx`](./primitives/Button.tsx), [`Card.tsx`](./primitives/Card.tsx), [`Badge.tsx`](./primitives/Badge.tsx), [`Input.tsx`](./primitives/Input.tsx), [`Textarea.tsx`](./primitives/Textarea.tsx), [`Label.tsx`](./primitives/Label.tsx), [`Table.tsx`](./primitives/Table.tsx), [`Separator.tsx`](./primitives/Separator.tsx), [`Banner.tsx`](./primitives/Banner.tsx), [`Form.tsx`](./primitives/Form.tsx) (react-hook-form context), [`InputGroup.tsx`](./primitives/InputGroup.tsx), [`Command.tsx`](./primitives/Command.tsx) (cmdk), [`Combobox.tsx`](./primitives/Combobox.tsx), [`FlagIcon.tsx`](./primitives/FlagIcon.tsx), [`Progress.tsx`](./primitives/Progress.tsx), [`Slider.tsx`](./primitives/Slider.tsx), [`Sonner.tsx`](./primitives/Sonner.tsx) (the toaster), [`RichLink.tsx`](./primitives/RichLink.tsx). Plus [`primitives/utils/helpers.ts`](./primitives/utils/helpers.ts): one predicate, `hasFlag` |
| `animate/primitives/` | Unstyled wrappers over `@base-ui/react`, the bottom of the animated stack, and internal to `animate/`: [`animate/primitives/base/Dialog.tsx`](./animate/primitives/base/Dialog.tsx), `Popover.tsx`, `Tooltip.tsx`; [`animate/primitives/animate/MotionSlot.tsx`](./animate/primitives/animate/MotionSlot.tsx) |
| `animate/base/` | The styled, motion-aware components built on the layer above or directly on `@base-ui/react`: [`Accordion.tsx`](./animate/base/Accordion.tsx), [`Checkbox.tsx`](./animate/base/Checkbox.tsx), [`Collapsible.tsx`](./animate/base/Collapsible.tsx), `Dialog.tsx`, [`DropdownMenu.tsx`](./animate/base/DropdownMenu.tsx), [`Popover.tsx`](./animate/base/Popover.tsx), [`Tooltip.tsx`](./animate/base/Tooltip.tsx), [`Sidebar.tsx`](./animate/base/Sidebar.tsx), plus [`animate/base/Drawer.tsx`](./animate/base/Drawer.tsx) (vaul) and [`animate/base/Slot.tsx`](./animate/base/Slot.tsx) |
| `animate/components/` | Compositions with their own behaviour: [`Counter.tsx`](./animate/components/Counter.tsx), [`Tabs.tsx`](./animate/components/Tabs.tsx), [`FeatureList.tsx`](./animate/components/FeatureList.tsx), [`RadialNav.tsx`](./animate/components/RadialNav.tsx) |
| [`animate/effects/`](./animate/effects) | [`AutoHeight.tsx`](./animate/effects/AutoHeight.tsx) and [`MotionHighlight.tsx`](./animate/effects/MotionHighlight.tsx): behaviour applied to someone else's children |
| [`animate/icons/`](./animate/icons) | 22 animated SVG icons plus [`animate/icons/Icon.tsx`](./animate/icons/Icon.tsx), which exports `AnimateIcon`, `IconWrapper` and `useVariants`. Excluded from the coverage report; `Icon.tsx` beside them is tested |
| [`animate/text/`](./animate/text) | [`SlidingNumber.tsx`](./animate/text/SlidingNumber.tsx) and [`animate/text/Rotating.tsx`](./animate/text/Rotating.tsx) |
| [`animate/providers/`](./animate/providers) | [`LazyMotionProvider.tsx`](./animate/providers/LazyMotionProvider.tsx), a nine-line `LazyMotion` wrapper, mounted once in the locale layout |

There is no `Switch` in `primitives/`; the only one is [`animate/base/Switch.tsx`](./animate/base/Switch.tsx).

## Conventions

- **Named exports only.** No `default` anywhere in this folder, and no barrel `index.ts`; import the
  module directly.
- **`cn()` on every className seam.** `@ui/utils/cn` merges Tailwind classes so a caller's `className`
  overrides the component's rather than fighting it.
- **`data-slot` on composition sub-parts** (`Card`, `Form`, `InputGroup`, `Table`), so a parent can
  reach a specific part without a class-name contract.
- **`asChild` via `animate/base/Slot.tsx`**, which merges props with `mergeProps` from
  `@base-ui/react/merge-props` and composes refs. `Button`, `Badge` and `Form` use it. Do not write
  another one. The motion equivalent is `MotionSlot`.
- **Design tokens, not literals.** 3px frames (`border-[3px] border-[var(--frame)]`), the
  `--shadow-brutal-*` scale and `--color-brand-*` are all defined in [`src/ui/styles/global/index.css`](../../styles/global/index.css);
  `hit-area-stable` is a Tailwind `@utility` in [`src/ui/styles/utilities/index.css`](../../styles/utilities/index.css). See
  [`styles/CLAUDE.md`](../../styles/CLAUDE.md).

**CVA is not the rule.** Only four files use `class-variance-authority` (`Button.tsx`, `Badge.tsx`,
`InputGroup.tsx` and `animate/base/Sidebar.tsx`), and only `buttonVariants` and `badgeVariants` are
exported. Everything else is a plain `cn()` call, and `Banner.tsx` and the planner's `MetricCard`
instead take a `colorScheme` key into a local `COLOR_SCHEMES` record. Reach for CVA when a component
genuinely has orthogonal variant axes; a single `variant` prop with four values does not need it.

## Layer rules

The accessibility primitive is **`@base-ui/react`**, not Radix: no Radix package is installed. Motion
comes from `motion` (`motion/react`), with `vaul` for the drawer, `cmdk` for the command palette,
`sonner` for toasts and `lucide-react` for static icons.

**Import `m`, never `motion`.** Every animated file in this folder imports `m` from `motion/react`
because the app wraps everything in `LazyMotionProvider`, which loads `domAnimation` on demand. A
`motion.div` re-introduces the full feature bundle that the provider exists to defer. There is not a
single `motion.` usage in `src/ui` today; keep it that way. Nearly everything here ships to the
browser: the planner runs there end to end
([ADR 0001](../../../../../../adr/0001-planner-runs-in-the-browser.md)), so a dependency added in this
folder is a dependency added to the client bundle of every screen.

Coupling back into the rest of the app is small, but it is not zero. The complete list:

- `@ui/hooks/*` is fair game: [`useControlledState.tsx`](../../hooks/useControlledState.tsx), [`useIsInView.tsx`](../../hooks/useIsInView.tsx), [`useAutoHeight.tsx`](../../hooks/useAutoHeight.tsx),
  [`useMobile.ts`](../../hooks/useMobile.ts). These are generic React utilities, not product state.
- `animate/base/Sidebar.tsx` writes the `sidebar_state` cookie through `@ui/utils/cookie` and reads it back
  from `document.cookie` on mount. It exports `SIDEBAR_COOKIE_NAME`, and **nothing in this package imports
  it**: no server layout reads the cookie and passes a `defaultOpen`, so the rail always renders expanded
  and then collapses once the effect runs. Either wire the layout up or stop describing the export as
  shared; what is not true today is that anything in [`apps/web`](../../../..) uses the key. The docs site does: two wiki
  pages import it to document the cookie's name, which is also why `temporal-polyfill` ends up in the docs
  dependency list to render a string. This bullet said "nothing outside that file" until that reach was
  derived mechanically; the seam is invisible from this side, which is the reason to check rather than
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
locales, and it is invisible to everyone testing visually. Four of them shipped that way: `Dialog`'s close
button said "Close" on every modal in the app, `SidebarTrigger` said "Toggle Sidebar", `Sidebar`'s mobile
landmark said "Sidebar" and `RadialNav` said "Radial navigation". Each now takes the string as a prop
(`closeLabel`, `label`, `landmarkLabel`, `aria-label`), keeping the English literal as the default so a caller
that forgets degrades to what it said before rather than to nothing. The callers pass the `a11y` namespace;
see [`../../i18n/CLAUDE.md`](../../i18n/CLAUDE.md). A brand name is the one thing that stays literal:
`aria-label='Forever PTO'` is correct in every locale.

**A name the caller can forget is a name that gets forgotten, so four components now demand one.** The
`closeLabel` shape above (optional, with an English default) degrades to what the component said before,
and that is only a safe default where the component *said* something. Where it said nothing, the prop is
required and the compiler is the check:

- [`primitives/Label.tsx`](./primitives/Label.tsx) takes `htmlFor: string`, not the optional one `ComponentProps<'label'>` carries. A
  `<label>` naming nothing is not inert, it is a promise to a screen reader that never resolves, and four of
  its five callers made it: two in `shared/cookie-consent/CookieConsentDialog.tsx`, one over the donation
  presets and one over the Workday counter heading. It also destructures `children` and renders them rather
  than letting them arrive through the spread: that is what lets Biome see the label has content, and it is
  why the file no longer carries a `noLabelWithoutControl` suppression.
- [`animate/base/Switch.tsx`](./animate/base/Switch.tsx) takes `{ id } | { 'aria-label' } | { 'aria-labelledby' }`, intersected with its
  other props, so one of the three has to be there. Base UI renders it as `<button role='switch'>` with no
  name of its own: the four switches in the cookie dialog announced as "switch, not pressed" and nothing
  else.
- [`animate/base/Checkbox.tsx`](./animate/base/Checkbox.tsx) takes the identical union, and it took nothing at all for a long
  time, which is exactly how it drifted: Base UI renders it as `<button role='checkbox'>` with no intrinsic
  name either, the rule above was written for `Switch` alone, and the file sitting beside it never got the
  same treatment. Two of its three call sites already passed `aria-label`; the mobile Holiday card in
  `pages/planner/holidays/HolidaysTable.tsx` did not, so on a phone every Holiday row announced as "checkbox,
  not checked" while the desktop row two hundred lines away announced "Select Christmas Day". A fourth call
  site cannot repeat it. Its own test carries a `@ts-expect-error` over a nameless `<Checkbox />`, so
  loosening the type fails `pnpm typecheck` on an unused suppression rather than passing quietly.
- [`primitives/Slider.tsx`](./primitives/Slider.tsx) takes `label: string` and puts it on `Slider.Thumb`, which is where Base UI's
  real control, a nested `<input type='range'>`, lives. Its `id` prop is gone: it landed on `Slider.Root`,
  which renders a `<div>`, so the `<label htmlFor>` pointing at it named nothing.
- [`animate/components/Counter.tsx`](./animate/components/Counter.tsx) takes `decrementLabel` and `incrementLabel`. Its buttons were named by
  their own text content, `−` and `+`, which announces the operation and never its subject. The existing
  `label` prop is unrelated: it is the visible caption under the number.

The union on `Switch` proves a caller thought about the name, not that the name exists: `id` only names
anything if some `<label htmlFor>` points at it. That is the same guarantee `htmlFor: string` gives, and it
is the most a type can offer here.

**`RadialNav` is a `<fieldset>` now, and it used to declare a `role="menu"` it did not implement.** The
container said `menu` and each button said `menuitem`, but every button sits inside its own positioning
`div`, and `menu` requires it to *own* its items, so several readers exposed the menu as empty. There was no
roving focus either, and, decisively, it is not a menu: it is the Roadmap's category selector and nothing
navigates. That is the same reasoning that removed the calendar's `role="grid"`, recorded in
[`../pages/planner/CLAUDE.md`](../pages/planner/CLAUDE.md): do not declare a pattern you have not written. It
is a group, which promises nothing, and Biome's `useSemanticElements` wants the element rather than the role,
hence `<fieldset aria-label>`; the label is still the caller's, because this folder cannot translate. Each
button carries `aria-pressed`, so the selected category is announced and not merely coloured. `aria-current`
would read correctly too; `aria-pressed` is what the calendar's day cells already use for "this one is on".

**`RadialNav` accepts `HTMLAttributes` and spreads none of them.** It destructures what it uses and drops the
rest, so `aria-label` had to be named explicitly to be honoured at all. Anything else a caller passes
(`id`, `data-*`, a handler) is silently discarded today. Widen the destructure rather than assuming the
prop arrives.

## Gotchas

**`Tooltip` only mints a `TooltipProvider` when it is given a delay of its own.** It used to mint one
unconditionally, defaulting to `delay = 0`, and since `TooltipTrigger` resolves `delay ?? use(TooltipDelayContext)`
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

**`SidebarProvider` is mounted exactly once in the app, and `Sidebar.test.tsx` reaches outside `core/` to
prove it.** The provider is the only context in this folder that the product mounts by hand, and a second one
nested inside the first is invisible: `useSidebar` resolves to the nearest, so every consumer inside the inner
provider agrees with every other and the outer one's state simply goes dead. The test walks every `.tsx` under
`src/` and asserts one mount site, `app/[locale]/(app)/planner/layout.tsx`. It is the one test here that reads
the rest of the app; that is deliberate, because the defect it catches cannot be seen from inside this folder.

**`animate/base/Sidebar.tsx` writes nothing to `document.body`, and it used to.** Its mobile branch wrapped
the drawer in `<AnimatePresence onExitComplete={() => { document.body.style.pointerEvents = ''; }}>`, which
is a counter-hack: `vaul` sets `document.body.style.pointerEvents = 'auto'` on a `requestAnimationFrame`
whenever a `Drawer` is mounted with `modal={false}`, and `pages/planner/ManagementBar.tsx` keeps one mounted
for the life of the planner screen on mobile. Two modules were writing the same global from opposite
directions with no ordering between them, and the sidebar's half only ran when an exit animation *completed*;
a route change or an unmount mid-spring skipped it.

The reset went rather than becoming an unmount cleanup, because there was nothing to reset. This module never
applies a body-level pointer lock: the mobile drawer is `aria-modal='false'` on purpose and its backdrop is a
real `fixed inset-0 z-51` element with its own `onClick`, so it blocks by itself. Nothing else in `apps/web`
writes body pointer events, and `vaul`'s value is `auto`, which is the initial value: permanent, benign, and
not ours to undo. `Sidebar.test.tsx` fails on any `document.body.style` in this file. If a component here ever
does need a body-level lock, it owns the restore in the same effect's cleanup, not in an animation callback.

**`vaul` is patched to forward `modal` to the Radix `Dialog.Root` it wraps, because 1.1.2 does not.**
Unpatched, every vaul drawer mounts a *modal* Radix dialog whatever its `modal` prop says, and Radix's
content effect then sets `document.body.style.pointerEvents = 'none'` and `aria-hidden` on everything
outside the drawer. The `requestAnimationFrame` counter-hack above is vaul's own answer to that, and it only
fires at `Drawer.Root` mount or on an `open` *transition*; `ManagementBar`'s drawer is mounted with
`open={true}` from its first render and its content commits later (a `dynamic()` chunk), so the lock landed
after the hack and stayed. The symptom was the whole mobile planner ignoring taps while only the drawer's
visible band answered, plus the entire page hidden from screen readers. The patch
([`patches/vaul@1.1.2.patch`](../../../../../../patches/vaul@1.1.2.patch)) makes `modal={false}` reach Radix,
so no lock is ever taken and the counter-hack becomes a harmless no-op; a vaul bump that drops the patch
fails the install loudly, and the root guide's patched-dependencies gotcha owns the Renovate side.

**[`utils/cookie.ts`](../../utils/cookie.ts) feature-detects the Cookie Store API and falls back to `document.cookie`.** The bare
`cookieStore` global does not exist in Firefox, in Safari before 18.4, or in any insecure context, so the
write threw a `ReferenceError` that `SidebarProvider.setOpen`'s `.catch(() => {})` swallowed; the sidebar
silently forgot its collapsed state on every reload in those browsers, with nothing logged. The `typeof`
guard is the same shape the root guide mandates for `window` and `document`, and for the same reason: a bare
identifier that is not defined throws rather than evaluating to `undefined`. `cookie.test.ts` stubs the
global in its `beforeEach`, which is exactly what hid this, so the fallback has its own block that stubs it
away.

**The dialog lives in [`animate/base/Dialog.tsx`](./animate/base/Dialog.tsx) and nowhere else.** `primitives/` used to carry a
pure re-export of it; the seven callers now import the implementation directly. Do not reintroduce a
re-export: the no-barrel convention has no exception here.

**There is one `Rotating.tsx` now, and there used to be two.** `animate/text/Rotating.tsx` exports
`RotatingText`, a self-contained `AnimatePresence` cycle over a string array, and it supplies its own
`overflow-hidden py-1` wrapper. A second file under `animate/primitives/texts/` exported `RotatingTextContainer`,
described here as "a context provider with no visual output"; it was the opposite on both counts. It built
its context with `const [RotatingTextProvider] = getStrictContext(…)`, discarding the consumer hook, and
**nothing in `src/` ever read that context**; its only output was a redundant `div`. So its `useIsInView`
subscription and its `setTimeout`+`setInterval` cycle re-rendered the footer forever while changing nothing
on screen. `DevFooter` nested one inside the other and drove the emoji from a *third* interval of its own:
random, not sequential, which is why it does not simply pass `EMOJIS` to `RotatingText` now. Deleting the
container left the render identical.

**`animate/primitives/` is internal to `animate/`, and that is now true rather than aspirational.** It had
three importers from outside. One was the no-op above. The other two took `Switch`, which was never an
unstyled wrapper: it carried the full `border-[3px] border-[var(--frame)]` and `--shadow-brutal-3` treatment,
so it was misfiled rather than merely leaked. It lives in `animate/base/Switch.tsx` now beside `Checkbox` and
`Collapsible`, its two styled siblings, and it has the co-located test they have. The folder has zero
external importers; keep it that way, and promote rather than reach in.

`Switch`'s context was the same shape as the one above on a smaller scale: it published `isChecked`,
`setIsChecked`, `isPressed` and `setIsPressed`, and `SwitchThumb`, the only consumer, reads `isPressed`
alone. It carries `isPressed` and nothing else now. Note when reading its test that the controlled/
uncontrolled behaviour is enforced *twice*: `useControlledState` and `SwitchPrimitives.Root`'s own `checked`
prop both do it, so removing either one alone leaves the suite green. `useControlledState` earns its place
for `onCheckedChange`, not for the rendered state.

**`IconWrapper` still drops `persistOnAnimateEnd` when there is no parent context.** The two context
values in `animate/icons/Icon.tsx` carry it, so a parent `AnimateIcon` reaches a nested icon, but the
context-free branch of `IconWrapper` builds its `AnimateIcon` without `persistOnAnimateEnd` or
`initialOnAnimateEnd`: on a standalone icon both are inert. Nothing passes them today.

**`primitives/Form.tsx` names an `aria-describedby` only for an element that exists, and for a long time it
named one that never did.** `useFormField` builds `formDescriptionId` as `${id}-form-item-description` and
`FormControl` put it on every control unconditionally; grepping `apps/web/src` for `form-item-description`
returned exactly one hit, that definition. There is no `FormDescription` in this fork: shadcn's original has
one, this copy dropped it and kept the reference, so in the no-error case the dangling id was the *only*
value `aria-describedby` carried. That is the third instance of the defect [`../CLAUDE.md`](../CLAUDE.md)
names as "a promise to a screen reader that never resolves".

Both halves are fixed rather than one. `FormDescription` exists again, and `FormItem` holds a
`hasDescription` flag that `FormDescription` sets from an effect, so `FormControl` names the id only when the
element is on the page and omits `aria-describedby` entirely when there is nothing to describe. The
registration costs one extra render on a field that has a description; the alternative, always emitting the
id and requiring every caller to render a description, is what shipped the defect.
`shared/donate/DonationForm.tsx`'s base-price note was the loose `<p>` that should have been one all along.

**`primitives/Slider.tsx` exists to pin the value type.** `@base-ui/react` hands its `onValueChange`
and `onValueCommitted` callbacks a `number | readonly number[]`; every caller in this app wants a
mutable `number[]`, so the wrapper copies the array or boxes the lone number before calling back.
Widening the prop type instead would push that fork into each caller.

It also pins where the accessible name goes. Base UI splits the slider into a `Root` that renders a
`<div>`, a `Thumb` that renders a `<div>` **and a nested `<input type='range'>`**, and a `Slider.Label`
part this wrapper does not use. The name has to reach the input, so `label` becomes `aria-label` on the
`Thumb`; `aria-labelledby` on the `Root` would also work and would need a real element id threaded to it.
Putting it on the `Root` instead is the mistake that looks right.

**`primitives/Combobox.tsx` keys its `CommandItem` by `option.value` and carries the label in `keywords`,
and the two halves are one decision.** cmdk hands `onSelect` the item's own `value` (trimmed, case intact),
and that string is the only thing identifying which row was clicked. The item used to be keyed by
`option.label`, so `handleSelect` had to reverse-look-up the option *by label*: two options sharing a label
collided on the first one, which Regions can plausibly do. Keying by `value` fixes that, but cmdk also
filters on `value`, so the change on its own would have silently reduced the country search to matching ISO
codes: nobody types `ES` to find Spain. `keywords={[option.label]}` puts the label back in the filter's
input; cmdk scores value and keywords together, so both now match. Removing the `keywords` prop is not a
tidy-up, and [`Combobox.test.tsx`](./primitives/Combobox.test.tsx) has a case that goes red for it.

**It hands the option's own value back, and it used to lower-case it behind an `as`.** `onChange` was called
with `option.value.toLowerCase() as TValue`: the cast existed only to silence the compiler about a string
the component had just changed. Country and Region codes arrive uppercase (`i18n-iso-countries` and
`date-holidays`' `getStates()` both emit them that way), so the store held a value no option list contained.
Nothing broke, because every reader compares case-insensitively: `getRegionName`, `Summary`'s two lookups,
this component's own `selectedOption`, and `date-holidays` itself, which accepts either casing for country
and region alike. That is what made it safe to remove and also what made it invisible. A primitive that
rewrites the value it was given is lying to its caller; hand back what the option holds.

**The comparison guarding that call stays case-insensitive, and it is not symmetry with the line above.**
`option.value.toLowerCase() !== value.toLowerCase()` is what stops a click on the already-selected option
from firing `onChange`, and `setCountry` clears the Region in the same `set`, so a strict compare would
wipe a visitor's Region the moment they re-picked their own country, for the whole population whose stored
country is still the lower-cased one the old code wrote or the `user-country` cookie supplies. The value
handed back is exact; the question of whether it *changed* is not.

**Its `PopoverContent` carried `id='combobox-listbox'` and nothing referenced it.** No `aria-controls`
anywhere in [`apps/web/src`](../../..) named it, so it bought no accessibility, and `PopoverContent` spreads its rest
props onto the *positioner*, not the popup, so it was not even labelling the list. What it did do is put a
literal id on a component the sidebar mounts four times: open two of them and the document holds two
`#combobox-listbox`. It is gone. If a listbox relationship is wanted here it has to be a generated id
threaded to a real `aria-controls`, not a constant.

**`RadialNav`'s `orbitRadius` is `size / 2 - 0.5`, and the half pixel is not slop.** It puts the
*centre* of each item circle on the parent circle's stroke rather than outside it: the parent radius
less half the border the child draws. Drop the `0.5` and the ring stops reading as concentric.

**`primitives/Sonner.tsx` takes a `closeLabel`, because the string it needed lived in a dependency.** The
hard-coded-name rule above closed four components and missed this one: sonner 2.0.8 defaults
`closeButtonAriaLabel = 'Close toast'` and reads the override from `toastOptions.closeButtonAriaLabel`, so
every toast in all six locales offered an English close button and nothing in `src/` held a string to grep
for. `Toaster` now takes `closeLabel`, defaulting to sonner's own wording so a caller that forgets loses
nothing, and both mount sites (`app/[locale]/(app)/planner/layout.tsx` and
`app/[locale]/(marketing)/layout.tsx`) pass `a11y.closeToast` through `getTranslations`. A defect can hide in
a dependency's default; the fix is the same prop shape as `closeLabel` on `Dialog`.

**`animate/providers/LazyMotionProvider.tsx` wraps its `LazyMotion` in `<MotionConfig reducedMotion="user">`,
and the CSS blanket is why nobody noticed it was missing.** `src/ui/styles/animations/index.css` carries a
correct global `@media (prefers-reduced-motion: reduce)` override, so the page *looks* covered; motion drives
transform, opacity and filter through the Web Animations API and inline style writes, which no CSS
`transition-duration` rule can reach. Sixty-two files in this package import `motion/react` and not one of
them mentioned `useReducedMotion`, `MotionConfig`, `motion-safe` or `motion-reduce`, so with reduce-motion set
at OS level a user still got the mobile sidebar sliding a viewport width on a stiff spring, every dialog
scaling and blurring in, and `SlidingNumber` animating every metric on every recalculation. One provider
covers all of them, because every render tree passes through one of its three mount sites
(`app/[locale]/layout.tsx`, `app/global-error.tsx`, `app/global-not-found.tsx`) and `MotionConfig` publishes
through the same context that every `m.*` component and every `m.create()` reads.
[`animate/providers/LazyMotionProvider.test.tsx`](./animate/providers/LazyMotionProvider.test.tsx) drives
motion's own `prefersReducedMotion` value and asserts `useReducedMotionConfig()` follows it in both
directions.

**`animate/base/Sidebar.tsx`'s mobile drawer manages focus itself, because it is not a Base UI `Dialog`.**
Every other modal in this package goes through `animate/primitives/base/Dialog.tsx`, which hands Base UI an
`initialFocus`/`finalFocus`; that branch is a raw `AnimatePresence` plus two `m.div`s. It had no initial
focus, no return focus and no Escape, so opening it left focus on the trigger now behind the overlay, and Tab
walked the whole planner underneath without ever reaching the drawer. It takes a `tabIndex={-1}` and a ref
now, focuses itself on open, remembers `document.activeElement` and restores it on close, and closes on
Escape from a window-level listener, because focus can legitimately leave the drawer and a local handler
would miss it.

**There is still no focus trap, and `aria-modal="false"` is why.** The two are one decision: this drawer
blocks the pointer with a real `fixed inset-0` backdrop rather than a body-level lock (see the
`document.body.style` note above), and a non-modal dialog does not trap. Setting `aria-modal="true"` while
the page behind it stays reachable would be the lie; adding a trap while claiming not to be modal would be
the other one. If the drawer ever becomes genuinely modal, both change together.

**The desktop rail is an `<aside>` and used to be four nested role-less `div`s.** The mobile branch got
`role="dialog"` and a label; the desktop branch got nothing, while `sidebar/AppSidebar.tsx` puts the entire
control surface inside it, so pressing the landmark key on the planner cycled between `main` and `footer` and
nothing else. `sidebar-container` is `<aside aria-label={landmarkLabel}>` now, which is the element Biome's
`useSemanticElements` demands over a bare `role="complementary"`, and it is the same `landmarkLabel` the
mobile branch already took.

**`MotionSlot` calls `m.create(children.type)` inside `useMemo`, keyed on the child's type.** A child
whose component identity changes between renders (anything defined inline) remints the motion
component every render and drops the animation state. Define the child at module scope.

## Testing

Vitest with `happy-dom`, co-located `*.test.tsx`. Coverage here is deliberately lopsided and a missing
test is usually a decision rather than an omission:

- `animate/base/` is covered file for file, and so are `animate/components/`, `animate/effects/`,
  `animate/text/SlidingNumber.tsx` and [`animate/primitives/base/Tooltip.tsx`](./animate/primitives/base/Tooltip.tsx). These carry state
  machines, controlled/uncontrolled fallbacks and event composition: the parts that break silently.
- `primitives/` has **one test, `Combobox.test.tsx`, and that is the whole list**. The rest of those files
  are markup plus `cn()`, and the Playwright suite in `e2e/` only proves the pages holding them render; see
  [`../CLAUDE.md`](../CLAUDE.md) for what those specs actually assert, which is less than the word "covered"
  suggests. `Combobox` earns its test because it is the one primitive here with a behaviour: it maps a click
  on a list item back to an option and decides what to hand its caller. It mocks
  `animate/base/Popover` the way [`animate/base/Popover.test.tsx`](./animate/base/Popover.test.tsx) mocks the Base UI primitives (the popup
  needs layout this environment does not have), and keeps `cmdk` real, because cmdk is what decides which
  string `onSelect` receives.
- `animate/icons/` is excluded from the **coverage report** only, and the glob already spares `Icon.tsx`.
  The 22 icons are mechanical wrappers around SVG path data; `Icon.tsx` is not, and its co-located
  [`Icon.test.tsx`](./animate/icons/Icon.test.tsx) runs with everything else. Nothing under `core/` is excluded from the test run.

**`Combobox` declares the nine props it honours, and used to declare the whole `<input>` surface.** It
extended `Omit<HTMLProps<HTMLInputElement>, "onChange">` while rendering a `<button>`, destructured four
inherited props and spread nothing, so every other prop the type advertised was silently discarded, and
several it advertised (`type`, `checked`, `multiple`, a numeric `size`) mean nothing on the element it
renders. No call site lost a prop, because all four pass only handled ones; the interface was what invited
the next caller to pass `aria-label` and watch it vanish. This is the defect recorded for `RadialNav` one
section up, and the same instruction applies: if a caller needs another prop, widen the destructure and
forward it to the `Button`.

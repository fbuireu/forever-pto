# apps/web/src/ui/i18n

## Purpose

The six translation catalogues, and nothing else. This folder holds no code — `messages/` contains one
JSON file per locale and the folder has no `.ts` file at all. Everything that decides *which* locale a
request gets lives elsewhere: the locale list and request config in `@infrastructure/i18n`
(`locales.ts`, `config.ts`, `routing.ts`, `cookie.ts`), and the locale-aware `Link` / `useRouter` /
`usePathname` in `@application/i18n/navigation` (`navigation.ts`).

Aliased `@i18n/*`. Excluded from the Vitest run and from coverage in `vitest.config.ts` — it is data.

## Languages

`en` (reference) · `es` · `ca` · `it` · `de` · `fr`

The list is not defined here. `LOCALES` in `@infrastructure/i18n/locales` is the source of truth, and
adding a bundle without adding it there gets the file ignored; adding it there without the bundle
breaks the dynamic import in `config.ts` at request time.

## Namespaces

`en.json` has 49 top-level namespaces and roughly 1,250 leaf keys. A namespace is the scope passed to
`useTranslations` in a client component or `getTranslations` in a server one:

```typescript
const t = useTranslations('sidebar');
t('strategy.optimized.label');
```

Namespaces map to a feature or a surface, not to a component tree, so more than one component reads
the same namespace and one component often reads several. Two consequences worth knowing before you
go hunting for a key:

- The namespace name does not always match the component. `pages/planner/Contact.tsx` reads
  `roadmap`, not `contact` — `contact` belongs to the contact form in `shared/contact/ContactModal.tsx`.
- `metadata` is read through `getTranslations({ locale, namespace: 'metadata' })` in four places, none of
  them a `'use client'` component: the two route `metadata.ts` files, `buildMarkdownPage.ts` under
  `@infrastructure/markdown` (the Markdown twin's title and description), and the async server component
  `modules/shared/seo/JsonLd.tsx`, which interpolates `title` and `description` into the WebApplication
  JSON-LD. Renaming a `metadata` key means checking all four — miss the last two and the structured data or
  the Markdown twin degrades silently, with every page still rendering correctly.

## Conventions

- Keys are camelCase, with three deliberate snake_case exceptions — all of them for the same reason: the key
  *is* a machine code, looked up by a value that arrives from elsewhere, so renaming it breaks the lookup
  silently rather than at compile time. `toasts.promoCodeErrors.*` mirrors the Stripe promotion-code error
  codes, indexed in `shared/donate/Donate.tsx`. `contact.errors.*` and `checkout.errors.*` mirror the
  `ApiError` constants and the Zod codes baked into the contact schema, indexed by `resolveApiErrorMessage`
  in `shared/utils/helpers.ts`. Do not "fix" any of the three to camelCase.
- A code with no key is not a bug on its own — `resolveApiErrorMessage` falls back to the namespace's generic
  message, which is why a missing key shows plausible copy rather than an error. That makes the omission
  invisible: if you add a code a user can reach, add its key in the same change.
- Never write a string in ALL CAPS. If an element must render uppercase, apply the `uppercase` class
  in the component — otherwise the copy is unreadable to screen readers and unfixable per locale.
- **`a11y` holds the accessible names that belong to `core/` components.** Those files may not call
  `useTranslations` ([`../modules/core/CLAUDE.md`](../modules/core/CLAUDE.md)), so each takes its label as a
  prop and the *caller* supplies the string from this namespace — `closeDialog` for every modal's close
  button, `toggleSidebar` and `sidebarLandmark` for the sidebar, `radialNavigation` for the roadmap dial. Put
  a name here only when the component that renders it cannot translate it itself; anything a feature
  component owns belongs in that feature's namespace, next to the copy it sits beside.
- Interpolation is `{variable}`; plurals use ICU (`{count, plural, one {…} other {…}}`); inline markup
  uses rich-text tags (`<b>`, `<link>`, `<em>`) that the component supplies as render functions.
  `createRichLink` in `core/primitives/RichLink.tsx` is the helper for the `<link>` case.
- Values are always strings. There are no arrays anywhere in the bundles: a list is a numbered or
  named set of sibling keys, because `next-intl` cannot interpolate into an array.
- `en.json` is the reference. Add a key there first, then to the other five in the same commit.

## Invariants

**Every bundle has exactly the keys `en.json` has** — no missing keys, no leftovers. This is asserted
by [`tests/docs-consistency.test.ts`](../../../../../tests/docs-consistency.test.ts), which flattens each file
and diffs it against the reference, so a half-finished translation fails the unit suite rather than
rendering a raw key in production. It reads unstaged files, so it fires before you commit.

**There is no fallback chain to English.** `config.ts` supplies `locale` and `messages` and nothing
else — no `onError`, no `getMessageFallback` — so a key present in `en.json` and missing from `de.json`
does not quietly fall back: it takes `next-intl`'s default handling, which surfaces the key path in the
UI rather than the copy. The parity test above is what keeps that from reaching production.

## Key names may carry a retired term; the strings may not

[`CONTEXT.md`](../../../../../CONTEXT.md) governs the words the product says, and the root guide calls a retired
name in code or copy a defect. A few **key names** still hold retired terms — `alternativesManager.totalOff`
and `totalDaysOff` for Effective Day, `ptoStatus.autoAssigned` for Suggested Day — while the strings behind
them say Effective Day and Suggested Day, in all six languages. That split is deliberate: a key is an
identifier no user reads, renaming one means
editing six bundles and every call site, and `tests/docs-consistency.test.ts` asserts key parity across all
six, so a half-finished rename fails the suite rather than the eye. Rename a key only as its own change, all
six bundles at once. **A translated string is different** — it is the product speaking, and it uses the
glossary's word.

## Gotchas

**The whole catalogue ships to the browser.** `src/app/[locale]/layout.tsx` mounts
`NextIntlClientProvider` with no `messages` prop, which hands the client every namespace for the
active locale — about 93 KB of JSON for `en`, more for the others. There is no per-route splitting.
Adding a namespace makes every page heavier, so a large block of copy used by one screen is worth
weighing rather than adding by reflex. Trimming this by rendering more copy on the server is not
available either: the planner is client-side end to end
([ADR 0001](../../../../../adr/0001-planner-runs-in-the-browser.md)), so most of the catalogue has to
reach the browser one way or another.

**`src/app/global-error.tsx` is English-only, on purpose.** It static-imports `en.json` alone and sets
`<html lang='en'>` even when the URL says `/de/…`, because global-error sits above the `[locale]`
segment and cannot reach the request config — importing all six catalogues to fix that would add them
to the root bundle of every route. A test in `src/app/global-error.test.tsx` greps that file for
catalogue imports and fails if a second one appears. Do not "complete" the localisation there.

**The server-side import is a template literal.** `config.ts` loads the catalogue with a dynamic
import interpolating the locale into the `@i18n/messages/` alias. The bundler resolves that by
globbing the directory, so any `.json` dropped into `messages/` becomes a bundle candidate whether or
not it is a locale.

## Out of scope

Locale routing, detection and the cookie (`@infrastructure/i18n`, see
[`infrastructure/CLAUDE.md`](../../infrastructure/CLAUDE.md)); transactional email copy, which is
hard-coded English in `application/email/templates/Contact.tsx` and has no locale plumbing at all; log
and error-report strings, which are never translated.

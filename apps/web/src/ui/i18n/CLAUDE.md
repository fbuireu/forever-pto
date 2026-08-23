# apps/web/src/ui/i18n

## Purpose

The six translation catalogues, and nothing else. This folder holds no code — `messages/` contains one
JSON file per locale and the folder has no `.ts` file at all. Everything that decides *which* locale a
request gets lives elsewhere: the locale list and request config in `@infrastructure/i18n`
([`locales.ts`](../../infrastructure/i18n/locales.ts), [`config.ts`](../../infrastructure/i18n/config.ts), [`routing.ts`](../../infrastructure/i18n/routing.ts), [`cookie.ts`](../../infrastructure/i18n/cookie.ts)), and the locale-aware `Link` / `useRouter` /
`usePathname` in `@application/i18n/navigation` ([`navigation.ts`](../../application/i18n/navigation.ts)).

Aliased `@i18n/*`. Excluded from the Vitest run and from coverage in [`vitest.config.ts`](../../../../../vitest.config.ts) — it is data.

## Languages

`en` (reference) · `es` · `ca` · `it` · `de` · `fr`

The list is not defined here. `LOCALES` in `@infrastructure/i18n/locales` is the source of truth, and
adding a bundle without adding it there gets the file ignored; adding it there without the bundle
breaks the dynamic import in `config.ts` at request time.

## Namespaces

[`en.json`](./messages/en.json) has 49 top-level namespaces and roughly 1,250 leaf keys. A namespace is the scope passed to
`useTranslations` in a client component or `getTranslations` in a server one:

```typescript
const t = useTranslations('sidebar');
t('strategy.optimized.label');
```

Namespaces map to a feature or a surface, not to a component tree, so more than one component reads
the same namespace and one component often reads several. Two consequences worth knowing before you
go hunting for a key:

- The namespace name does not always match the component. [`pages/planner/Contact.tsx`](../modules/pages/planner/Contact.tsx) reads
  `roadmap`, not `contact` — `contact` belongs to the contact form in [`shared/contact/ContactModal.tsx`](../modules/shared/contact/ContactModal.tsx).
- `metadata` is read through `getTranslations({ locale, namespace: 'metadata' })` in four places, none of
  them a `'use client'` component: the two route `metadata.ts` files, [`buildMarkdownPage.ts`](../../infrastructure/markdown/buildMarkdownPage.ts) under
  `@infrastructure/markdown` (the Markdown twin's title and description), and the async server component
  [`modules/shared/seo/JsonLd.tsx`](../modules/shared/seo/JsonLd.tsx), which interpolates `title` and `description` into the WebApplication
  JSON-LD. Renaming a `metadata` key means checking all four — miss the last two and the structured data or
  the Markdown twin degrades silently, with every page still rendering correctly.

## Conventions

- Keys are camelCase, with three deliberate snake_case exceptions — all of them for the same reason: the key
  *is* a machine code, looked up by a value that arrives from elsewhere, so renaming it breaks the lookup
  silently rather than at compile time. `toasts.promoCodeErrors.*` mirrors the Stripe promotion-code error
  codes, indexed in [`shared/donate/Donate.tsx`](../modules/shared/donate/Donate.tsx). `contact.errors.*` and `checkout.errors.*` mirror the
  `ApiError` constants and the Zod codes baked into the contact schema, indexed by `resolveApiErrorMessage`
  in [`shared/utils/helpers.ts`](../modules/shared/utils/helpers.ts). Do not "fix" any of the three to camelCase.
- A code with no key is not a bug on its own — `resolveApiErrorMessage` falls back to the namespace's generic
  message, which is why a missing key shows plausible copy rather than an error. That makes the omission
  invisible: if you add a code a user can reach, add its key in the same change.
- Never write a string in ALL CAPS. If an element must render uppercase, apply the `uppercase` class
  in the component — otherwise the copy is unreadable to screen readers and unfixable per locale.
- **`a11y` holds accessible names, and it is the only namespace that does.** Two kinds live here. Names a
  `core/` component cannot translate for itself, because those files may not call `useTranslations`
  ([`../modules/core/CLAUDE.md`](../modules/core/CLAUDE.md)) — each takes its label as a prop and the *caller*
  supplies it: `closeDialog` for every modal's close button, `toggleSidebar` and `sidebarLandmark` for the
  sidebar, `radialNavigation` for the roadmap dial, `skipToMainContent` for `SkipToContent`. And names more
  than one feature needs: `selectLanguage`, read by both the sidebar's `LanguageSelector` and the homepage's
  switcher. A name only one feature uses still belongs in that feature's namespace, next to the copy it sits
  beside.

  There was a second namespace called `accessibility` holding exactly those last two keys, and this file did
  not mention it — so an author asking "where does my `aria-label` go" had two plausible answers and no way
  to choose. It is merged in.

- **`errors` is the shared base for machine codes, and a feature namespace overrides it.**
  `resolveApiErrorMessage` looks in the caller's `<feature>.errors.<code>` first and falls back to
  `errors.<code>`, so a feature only carries the codes whose copy it needs to change. `contact.errors` and
  `checkout.errors` used to duplicate `invalid_email`, `email_required` and `invalid_body` character for
  character, and `internal_error` was the *only* one that legitimately differed — the checkout copy adds
  "Your card has not been charged", which [`../CLAUDE.md`](../CLAUDE.md) explains is load-bearing.

  So the generic `internal_error` is in the base too and `checkout` overrides it. That is what makes the
  precedence real rather than decorative: while nothing overlapped, inverting the lookup order changed
  nothing and no test could tell. Now it turns a case red.

- **Two validation messages live in `validation.email` because three forms need them.** `invalid` and
  `required` were written out in `validation.contact`, `validation.payment` **and** `premiumModal` — six strings
  across six locales for two messages. **Two had already drifted**: Catalan and French `validation.payment`
  said "a valid email is required" where every other copy, and the English, say "enter a valid email
  address". The imperative form is canonical and the payment copies were replaced, so merging fixed two
  strings rather than picking arbitrarily.

  The key-parity rule in `tests/docs-consistency.test.ts` could not have caught that: it compares key *sets*,
  not values, so duplicated copy is free to diverge. One home is the only real defence. A form reads
  `useTranslations('validation.email')` alongside its own namespace; the schema factories take their messages
  as a parameter object and did not change.
- Interpolation is `{variable}`; plurals use ICU (`{count, plural, one {…} other {…}}`); inline markup
  uses rich-text tags (`<b>`, `<link>`, `<em>`) that the component supplies as render functions.
  `createRichLink` in [`core/primitives/RichLink.tsx`](../modules/core/primitives/RichLink.tsx) is the helper for the `<link>` case.
- Values are always strings. There are no arrays anywhere in the bundles: a list is a numbered or
  named set of sibling keys, because `next-intl` cannot interpolate into an array.
- `en.json` is the reference. Add a key there first, then to the other five in the same commit.
- **A string that describes an icon is coupled to the module that draws it, and moves with it.**
  `tutorial.steps.alternativesDescription` tells the user the recommended alternative is "marked with a
  sparkle" — and [`pages/planner/PlannerPanel.tsx`](../modules/pages/planner/PlannerPanel.tsx) draws a `Sparkles` from `lucide-react`. The Catalan copy
  said **llamp** (a lightning bolt) and carried a `⚡` besides, so one locale in six described a badge the
  app has never rendered. Nothing catches this: key parity compares key sets, and no test reads an icon
  name out of a sentence. When you change an icon, grep the six bundles for its old name; when you write
  copy that names one, name the component that renders it.
- **The product addresses the user informally, in every locale.** `du` in German, `tu` in French, `tú` in
  Spanish, and the same throughout Catalan and Italian. Eight strings did not — the calendar-export toast
  and the promo confirmation in `de` and `fr` used `Sie`/`Ihr` and `vous`/`votre`/`veuillez` while the
  sibling key one line away stayed informal, so a single user journey switched register mid-sentence.
  [`tests/docs-consistency.test.ts`](../../../../../tests/docs-consistency.test.ts) scans [`de.json`](./messages/de.json) and [`fr.json`](./messages/fr.json) for the formal pronouns now,
  against a named allow-list. Two kinds of hit are legitimate and are listed there by key path: the
  `faq.sections.security` questions, which quote the user addressing **the operator**, and third-person
  `sie` in `cookiePolicy` and `legalNotice`, which means "they"/"it" and is not address at all. Add to that
  list only after checking which of the two you have.

## Invariants

**Every bundle has exactly the keys `en.json` has** — no missing keys, no leftovers. This is asserted
by [`tests/docs-consistency.test.ts`](../../../../../tests/docs-consistency.test.ts), which flattens each file
and diffs it against the reference, so a half-finished translation fails the unit suite rather than
rendering a raw key in production. It reads unstaged files, so it fires before you commit.

**There is no fallback chain to English.** `config.ts` supplies `locale` and `messages` and nothing
else — no `onError`, no `getMessageFallback` — so a key present in `en.json` and missing from [`de.json`](./messages/de.json)
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

**[`src/app/global-error.tsx`](../../app/global-error.tsx) is English-only, on purpose.** It static-imports `en.json` alone and sets
`<html lang='en'>` even when the URL says `/de/…`, because global-error sits above the `[locale]`
segment and cannot reach the request config — importing all six catalogues to fix that would add them
to the root bundle of every route. A test in [`src/app/global-error.test.tsx`](../../app/global-error.test.tsx) greps that file for
catalogue imports and fails if a second one appears. Do not "complete" the localisation there.

**The server-side import is a template literal.** `config.ts` loads the catalogue with a dynamic
import interpolating the locale into the `@i18n/messages/` alias. The bundler resolves that by
globbing the directory, so any `.json` dropped into `messages/` becomes a bundle candidate whether or
not it is a locale.

## Out of scope

Locale routing, detection and the cookie (`@infrastructure/i18n`, see
[`infrastructure/CLAUDE.md`](../../infrastructure/CLAUDE.md)); transactional email copy, which is
hard-coded English in [`application/email/templates/Contact.tsx`](../../application/email/templates/Contact.tsx) and has no locale plumbing at all; log
and error-report strings, which are never translated.

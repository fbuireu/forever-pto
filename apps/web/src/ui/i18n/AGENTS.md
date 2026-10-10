# apps/web/src/ui/i18n

## Purpose

The translation catalogues, and nothing else. This folder holds no code: `messages/` contains one
JSON file per locale and the folder has no `.ts` file at all. Everything that decides *which* locale a
request gets lives elsewhere: the locale list and request config in `@infrastructure/i18n`
([`locales.ts`](../../infrastructure/i18n/locales.ts), [`config.ts`](../../infrastructure/i18n/config.ts), [`routing.ts`](../../infrastructure/i18n/routing.ts), [`cookie.ts`](../../infrastructure/i18n/cookie.ts)), and the locale-aware `Link` / `useRouter` /
`usePathname` in `@application/i18n/navigation` ([`navigation.ts`](../../application/i18n/navigation.ts)).

Aliased `@i18n/*`. Excluded from the Vitest run and from coverage in [`vitest.config.ts`](../../../vitest.config.ts): it is data.

## Languages

`en` (reference) · `es` · `ca` · `it` · `de` · `fr`

The list is not defined here. `LOCALES` in `@infrastructure/i18n/locales` is the source of truth, and
adding a bundle without adding it there gets the file ignored; adding it there without the bundle
breaks the dynamic import in `config.ts` at request time.

## Namespaces

[`en.json`](./messages/en.json) has 49 top-level namespaces and roughly 1,300 leaf keys. A namespace is the scope passed to
`useTranslations` in a client component or `getTranslations` in a server one:

```typescript
const t = useTranslations('sidebar');
t('strategy.optimized.label');
```

Namespaces map to a feature or a surface, not to a component tree, so more than one component reads
the same namespace and one component often reads several. Consequences worth knowing before you
go hunting for a key:

- The namespace name does not always match the component. [`pages/planner/Contact.tsx`](../modules/pages/planner/Contact.tsx) reads
  `roadmap`, not `contact`; `contact` belongs to the contact form in [`shared/contact/ContactModal.tsx`](../modules/shared/contact/ContactModal.tsx).
- `metadata` has three readers, none of them a `'use client'` component:
  [`routeMetadata.ts`](../../infrastructure/seo/routeMetadata.ts) under `@infrastructure/seo` (every page's
  title and description, through `getTranslations({ locale, namespace: 'metadata' })`),
  [`buildMarkdownPage.ts`](../../infrastructure/markdown/buildMarkdownPage.ts) under `@infrastructure/markdown`
  (the Markdown twin's title and description, through `createTranslator`), and the async server component
  [`modules/shared/seo/JsonLd.tsx`](../modules/shared/seo/JsonLd.tsx), which interpolates `title` and
  `description` into the WebApplication JSON-LD. Renaming a `metadata` key means checking every one of them:
  miss the last two and the structured data or the Markdown twin degrades silently, with every page still
  rendering correctly.

## Conventions

- The snake_case keys are machine codes, looked up by a value that arrives from elsewhere, so renaming one
  breaks the lookup silently rather than at compile time. `toasts.promoCodeErrors.*` mirrors the Stripe
  promotion-code error codes, indexed in [`shared/donate/Donate.tsx`](../modules/shared/donate/Donate.tsx).
  `contact.errors.*` and `checkout.errors.*` mirror the `ApiError` constants and the Zod codes baked into the
  contact schema, indexed by `resolveApiErrorMessage` in [`shared/utils/helpers.ts`](../modules/shared/utils/helpers.ts).
- A code with no key is not a bug on its own; `resolveApiErrorMessage` falls back to the namespace's generic
  message, which is why a missing key shows plausible copy rather than an error, and why the omission is
  invisible.
- **[`tests/docs-consistency.test.ts`](../../../../../tests/docs-consistency.test.ts) fails a string in ALL
  CAPS.** The scan matches a run of two or more uppercase letters that is a whole token, against a named
  acronym allow-list. Whole-token matching is what keeps `iOS` and `BfDI` out of it: a bare `\p{Lu}{2,}` reads
  `OS` and `DI` inside them and reports both. A run joined to another by an underscore is a name from the code, not
  shouting, which is how the cookie policy names `NEXT_LOCALE`. A second case asserts every name on the allow-list
  is still used, so the list shrinks with the copy instead of accumulating.
- **The cookie policy names every cookie the app sets, by the name a browser shows, and the consent dialog lists
  it.** The contract suite collects the names from the code (every `cookies.set`, `setCookie` and `document.cookie`
  write in `src`) and fails a catalogue in `modules/shared/cookie-consent/config/config.ts` that does not list one
  as Forever PTO's, and a bundle whose `cookiePolicy` leaves one out, so a new cookie arrives with its catalogue
  entry, its `cookies.*Desc` and its policy line in all six bundles. The names stay literal in the copy,
  untranslated; a lifetime the code counts in days reads through `cookies.days`.
- **No bundle says the holiday data comes from an API.** The `date-holidays` dataset ships inside the app and
  nothing is fetched for it ([`../../infrastructure/services/holidays/AGENTS.md`](../../infrastructure/services/holidays/AGENTS.md)),
  so the policies call it data that ships with the app; the contract suite fails a value that names a holiday and an
  API together, with one holiday word per bundle.
- **`a11y` holds three kinds of string.** Names a `core/` component cannot translate for itself, because those
  files may not call `useTranslations` ([`../modules/core/AGENTS.md`](../modules/core/AGENTS.md)), so the
  *caller* supplies them: `closeDialog` for every modal's close button, `closeToast` for the sonner toaster,
  `toggleSidebar` and `sidebarLandmark` for the sidebar, `radialNavigation` for the roadmap dial,
  `numberField` for the `aria-roledescription` of every `NumberInput`, `skipToMainContent` for `SkipToContent`. Names more than one feature needs: `selectLanguage`, read through
  `useLanguageSwitch` by both the sidebar's `LanguageSelector` and the homepage's switcher. And text that exists
  only to be *announced*: `calculating`, `planUpdated` and `noPlan` are the planner's live-region strings, read
  by `CalendarList.tsx` and `ManagementBar.tsx` into `sr-only` `role="status"` spans.

- **`errors` is the shared base for machine codes, and a feature namespace overrides it.**
  `resolveApiErrorMessage` looks in the caller's `<feature>.errors.<code>` first and falls back to
  `errors.<code>`. `internal_error` is the override: the base carries the generic copy and `checkout` adds
  "Your card has not been charged", which [`../AGENTS.md`](../AGENTS.md) explains is load-bearing. That overlap
  is what lets [`shared/utils/helpers.test.ts`](../modules/shared/utils/helpers.test.ts) see the lookup order:
  inverted, one of its cases turns red.

- **The email messages every form shares live in `validation.email`.** A form reads
  `useTranslations('validation.email')` alongside its own namespace; the schema factories take their messages
  as a parameter object. The key-parity rule in `tests/docs-consistency.test.ts` compares key *sets*, not
  values, so a message copied into a second namespace would diverge unseen.
- Interpolation is `{variable}`; plurals use ICU (`{count, plural, one {…} other {…}}`); inline markup
  uses rich-text tags (`<b>`, `<link>`, `<em>`) that the component supplies as render functions.
  `createRichLink` in [`core/primitives/RichLink.tsx`](../modules/core/primitives/RichLink.tsx) is the helper for the `<link>` case.
- The `summary.notifications` banners are one `{count, plural, …}` message each, read by
  [`pages/planner/Summary.tsx`](../modules/pages/planner/Summary.tsx); `manualAdjustments` is a message per
  shape (`addedOnly`, `removedOnly`, `addedAndRemoved`), each a whole sentence, so `addedAndRemoved` is where
  German puts *Du hast* first and *entfernt* last.
- **A rich-text tag can hold the number, which keeps an animated counter inside an ICU message.** Those
  banners render the count through `SlidingNumber`. The messages write `<b><n>#</n> more days</b>`: `b` is the
  bold wrapper, `n` renders the counter and ignores its chunks, and `#` is the plural's own number, so the tag
  is still positioned by the translator. `manualAdjustments.addedAndRemoved` carries a count each way and
  therefore a tag each, `a` and `r`. Tags nest, and `#` resolves inside one.
- **A label and its number are one message too.** The planner's readouts (`alternativesManager.position` and
  `ptoStatus.suggestedCount`, `manualCount` and `remainingCount`) write `<label>Suggested:</label> <n>{count}</n>`:
  the component styles the label and draws the counter, and the translator orders and punctuates them, which is
  how French spaces its colon. The `sr-only` copy renders the same message with tags that return their chunks. A
  tag never shares a name with an argument, because the tag's function replaces the value: `position` closes on
  `<of> / {total}</of>`, not on a `total` tag.
- **[`../utils/currencies.test.ts`](../utils/currencies.test.ts) asserts that no message carries a currency
  symbol.** The value arrives already formatted, as `{amount}`: `amountFormatter` for a whole-euro price in a
  server component (`homepage.pricing.*`, `termsOfService.…maxLiability`) and `useCurrencyFormatter` for a
  charge in a client one. `homepage.stats.plansValue` takes
  `format.number(PLANS_GENERATED, { notation: "compact" })`, and German reads `12.000+` there, because German
  CLDR has no short form at that magnitude; that is the locale being right, not the formatter being wrong.
- **A string that describes an icon is coupled to the module that draws it.**
  `tutorial.steps.alternativesDescription` tells the user the recommended alternative is "marked with a
  sparkle", because [`pages/planner/PlannerPanel.tsx`](../modules/pages/planner/PlannerPanel.tsx) draws a
  `Sparkles` from `lucide-react`. Nothing catches a mismatch: key parity compares key sets, and no test reads an
  icon name out of a sentence.
- **[`tests/docs-consistency.test.ts`](../../../../../tests/docs-consistency.test.ts) scans
  [`de.json`](./messages/de.json) and [`fr.json`](./messages/fr.json) for the formal pronouns**, against a
  named allow-list. The legitimate hits are listed there by key path: the `faq.sections.security` questions,
  which quote the user addressing **the operator**, and third-person `sie` in `cookiePolicy` and `legalNotice`,
  which means "they"/"it" and is not address at all. The Spanish, Catalan and Italian bundles have no scan.

## Invariants

**Every bundle has exactly the keys `en.json` has**: no missing keys, no leftovers. This is asserted
by [`tests/docs-consistency.test.ts`](../../../../../tests/docs-consistency.test.ts), which flattens each file
and diffs it against the reference, so a half-finished translation fails the unit suite rather than
rendering a raw key in production. It reads unstaged files, so it fires before you commit.

**There is no fallback chain to English.** `config.ts` supplies `locale` and `messages` and nothing
else (no `onError`, no `getMessageFallback`), so a key present in `en.json` and missing from [`de.json`](./messages/de.json)
does not quietly fall back: it takes `next-intl`'s default handling, which surfaces the key path in the
UI rather than the copy. The parity test above is what keeps that from reaching production.

## Key names that carry a retired term

Some **key names** hold a term [`GLOSSARY.md`](../../../../../GLOSSARY.md) retires, for example
`summary.notifications.canImprove.reviewOptions` (Alternative), `alternativesManager.totalOff` (Effective Day),
`ptoDays.autoAssigned` (Suggested Day), `workdayCounter.dateRange` (Planning Window) and
`summary.yearSummary.firstBreak` (Rest Block). Renaming one edits every bundle and every call site, and the key
parity check fails a rename that stops halfway.

## Gotchas

**The catalogue ships to the browser minus the namespaces only the server reads.** `src/app/[locale]/layout.tsx`
and `global-not-found.tsx` hand `NextIntlClientProvider` `clientMessagesOf(await getMessages())`, which drops
`SERVER_ONLY_NAMESPACES` in [`infrastructure/i18n/clientMessages.ts`](../../infrastructure/i18n/clientMessages.ts):
the homepage, the FAQ, the legal pages, the metadata, the not-found page and the payment confirmation, all
rendered on the server. The list says what to leave out rather than what to send, so forgetting a namespace there costs bytes, never a blank string; and
[`clientMessages.test.ts`](../../infrastructure/i18n/clientMessages.test.ts) scans every `useTranslations` call,
including the few that compute their namespace, and fails when client code reads one the client is not sent.
Trimming this by rendering more copy on the server is not available: the planner is client-side end to end
([ADR 0001](../../../../../adr/0001-planner-runs-in-the-browser.md)), so most of the catalogue has to
reach the browser one way or another.

**A key nothing reads still ships, and nothing fails when it stops being read.** Key parity cannot see an
orphan, nor a `question` whose `answer` was deleted from every bundle alike. A namespace named after a
`core/` component is an orphan by construction, since
[`core/primitives/Command.tsx`](../modules/core/primitives/Command.tsx) and its siblings may not call
`useTranslations`: the caller passes the string from its own namespace. Two
readers are easy to miss. The FAQ entries are listed by hand in both
[`pages/homepage/sections/Faq.tsx`](../modules/pages/homepage/sections/Faq.tsx) and
[`shared/seo/JsonLd.tsx`](../modules/shared/seo/JsonLd.tsx), and an entry added to one and not the other
degrades the structured data silently. `planner.description` is read by `createTranslator` in
[`buildMarkdownPage.ts`](../../infrastructure/markdown/buildMarkdownPage.ts) for the Markdown twin, which no
component search finds. Check which of a near-identical pair has the reader before deleting either.

**[`src/app/global-error.tsx`](../../app/global-error.tsx) is English-only, on purpose.** It static-imports `en.json` alone and sets
`<html lang='en'>` even when the URL says `/de/…`, because global-error sits above the `[locale]`
segment and cannot reach the request config; importing every catalogue to fix that would add them
to the root bundle of every route. A test in [`src/app/global-error.test.tsx`](../../app/global-error.test.tsx) greps that file for
catalogue imports and fails if a second one appears. Do not "complete" the localisation there.

**The server-side import is a template literal.** `config.ts` loads the catalogue with a dynamic
import interpolating the locale into the `@i18n/messages/` alias. The bundler resolves that by
globbing the directory, so any `.json` dropped into `messages/` becomes a bundle candidate whether or
not it is a locale.

## Out of scope

Locale routing, detection and the cookie (`@infrastructure/i18n`, see
[`infrastructure/AGENTS.md`](../../infrastructure/AGENTS.md)); transactional email copy, which is
hard-coded English in [`application/email/templates/Contact.tsx`](../../application/email/templates/Contact.tsx) and has no locale plumbing at all; log
and error-report strings, which are never translated.

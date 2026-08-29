# apps/web/src/ui/i18n

## Purpose

The six translation catalogues, and nothing else. This folder holds no code: `messages/` contains one
JSON file per locale and the folder has no `.ts` file at all. Everything that decides *which* locale a
request gets lives elsewhere: the locale list and request config in `@infrastructure/i18n`
([`locales.ts`](../../infrastructure/i18n/locales.ts), [`config.ts`](../../infrastructure/i18n/config.ts), [`routing.ts`](../../infrastructure/i18n/routing.ts), [`cookie.ts`](../../infrastructure/i18n/cookie.ts)), and the locale-aware `Link` / `useRouter` /
`usePathname` in `@application/i18n/navigation` ([`navigation.ts`](../../application/i18n/navigation.ts)).

Aliased `@i18n/*`. Excluded from the Vitest run and from coverage in [`vitest.config.ts`](../../../../../vitest.config.ts): it is data.

## Languages

`en` (reference) · `es` · `ca` · `it` · `de` · `fr`

The list is not defined here. `LOCALES` in `@infrastructure/i18n/locales` is the source of truth, and
adding a bundle without adding it there gets the file ignored; adding it there without the bundle
breaks the dynamic import in `config.ts` at request time.

## Namespaces

[`en.json`](./messages/en.json) has 48 top-level namespaces and roughly 1,270 leaf keys. A namespace is the scope passed to
`useTranslations` in a client component or `getTranslations` in a server one:

```typescript
const t = useTranslations('sidebar');
t('strategy.optimized.label');
```

Namespaces map to a feature or a surface, not to a component tree, so more than one component reads
the same namespace and one component often reads several. Two consequences worth knowing before you
go hunting for a key:

- The namespace name does not always match the component. [`pages/planner/Contact.tsx`](../modules/pages/planner/Contact.tsx) reads
  `roadmap`, not `contact`; `contact` belongs to the contact form in [`shared/contact/ContactModal.tsx`](../modules/shared/contact/ContactModal.tsx).
- `metadata` is read through `getTranslations({ locale, namespace: 'metadata' })` in four places, none of
  them a `'use client'` component: the two route `metadata.ts` files, [`buildMarkdownPage.ts`](../../infrastructure/markdown/buildMarkdownPage.ts) under
  `@infrastructure/markdown` (the Markdown twin's title and description), and the async server component
  [`modules/shared/seo/JsonLd.tsx`](../modules/shared/seo/JsonLd.tsx), which interpolates `title` and `description` into the WebApplication
  JSON-LD. Renaming a `metadata` key means checking all four: miss the last two and the structured data or
  the Markdown twin degrades silently, with every page still rendering correctly.

## Conventions

- Keys are camelCase, with three deliberate snake_case exceptions, all of them for the same reason: the key
  *is* a machine code, looked up by a value that arrives from elsewhere, so renaming it breaks the lookup
  silently rather than at compile time. `toasts.promoCodeErrors.*` mirrors the Stripe promotion-code error
  codes, indexed in [`shared/donate/Donate.tsx`](../modules/shared/donate/Donate.tsx). `contact.errors.*` and `checkout.errors.*` mirror the
  `ApiError` constants and the Zod codes baked into the contact schema, indexed by `resolveApiErrorMessage`
  in [`shared/utils/helpers.ts`](../modules/shared/utils/helpers.ts). Do not "fix" any of the three to camelCase.
- A code with no key is not a bug on its own; `resolveApiErrorMessage` falls back to the namespace's generic
  message, which is why a missing key shows plausible copy rather than an error. That makes the omission
  invisible: if you add a code a user can reach, add its key in the same change.
- **Never write a string in ALL CAPS, and [`tests/docs-consistency.test.ts`](../../../../../tests/docs-consistency.test.ts) now checks it.** If an element must render
  uppercase, apply the `uppercase` class in the component; otherwise the copy is unreadable to screen
  readers and unfixable per locale. Two keys shouted in all six bundles and the rule had nothing behind it:
  `donationForm.promoCodePlaceholder`, whose input already carries `className="... uppercase"`, so the joke
  renders exactly as before from sentence-case copy; and
  `termsOfService.sections.refundPolicy.exclusions.description`, which capitalised the negation for emphasis
  (French escalated to two words) and now marks it with `<b>`, the rich-text tag the bundles already use.
  Emphasis is markup, the same way uppercasing is a class.

  The scan matches a run of two or more uppercase letters that is a whole token, against a named acronym
  allow-list. Whole-token matching is what keeps `iOS` and `BfDI` out of it: a bare `\p{Lu}{2,}` reads `OS`
  and `DI` inside them and reports both. A second case asserts every name on the allow-list is still used,
  so the list shrinks with the copy instead of accumulating.
- **`a11y` holds accessible names, and it is the only namespace that does.** Two kinds live here. Names a
  `core/` component cannot translate for itself, because those files may not call `useTranslations`
  ([`../modules/core/CLAUDE.md`](../modules/core/CLAUDE.md)); each takes its label as a prop and the *caller*
  supplies it: `closeDialog` for every modal's close button, `closeToast` for the sonner toaster,
  `toggleSidebar` and `sidebarLandmark` for the sidebar, `radialNavigation` for the roadmap dial,
  `skipToMainContent` for `SkipToContent`. And names more than one feature needs: `selectLanguage`, read by
  both the sidebar's `LanguageSelector` and the homepage's switcher. A name only one feature uses still
  belongs in that feature's namespace, next to the copy it sits beside.

  A third kind joined them: text that exists only to be *announced*, never rendered. `calculating`,
  `planUpdated` and `noPlan` are the planner's live-region strings, read by `CalendarList.tsx` and
  `ManagementBar.tsx` into `sr-only` `role="status"` spans. They are here rather than in `planner` because
  they answer the same question the names do, which is what a screen reader is told and a sighted user never
  sees, and grouping them keeps that whole surface reviewable in one place.

  There was a second namespace called `accessibility` holding exactly those last two keys, and this file did
  not mention it, so an author asking "where does my `aria-label` go" had two plausible answers and no way
  to choose. It is merged in.

- **`errors` is the shared base for machine codes, and a feature namespace overrides it.**
  `resolveApiErrorMessage` looks in the caller's `<feature>.errors.<code>` first and falls back to
  `errors.<code>`, so a feature only carries the codes whose copy it needs to change. `contact.errors` and
  `checkout.errors` used to duplicate `invalid_email`, `email_required` and `invalid_body` character for
  character, and `internal_error` was the *only* one that legitimately differed: the checkout copy adds
  "Your card has not been charged", which [`../CLAUDE.md`](../CLAUDE.md) explains is load-bearing.

  So the generic `internal_error` is in the base too and `checkout` overrides it. That is what makes the
  precedence real rather than decorative: while nothing overlapped, inverting the lookup order changed
  nothing and no test could tell. Now it turns a case red.

- **Two validation messages live in `validation.email` because three forms need them.** `invalid` and
  `required` were written out in `validation.contact`, `validation.payment` **and** `premiumModal`: six strings
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
- **A sentence is one key. A component may not assemble one out of several.** Six keys under
  `summary.notifications` were glued together at the render site: `canImprove.message` + a number +
  `moreDays` + `toYourPlan`, and the same shape for `manualAdjustments.*` and `customHolidays.*`. Two things
  follow from that and neither is fixable by a translator. The singular/plural choice was an `if` in
  [`pages/planner/Summary.tsx`](../modules/pages/planner/Summary.tsx), so no locale could express a form
  other than *one* and *other*, and none could reorder: German had to smear one verb across two fragments
  and Catalan had to end a clause where English ends it. They are one `{count, plural, …}` message each now,
  the pattern `calendar.daysOff`, `holidaysTable.deleteHolidays` and `calendarExport.description` already
  used. `manualAdjustments` is three messages rather than one because the banner has three shapes, added,
  removed and both; each is a whole sentence, so `addedAndRemoved` is where German puts *Du hast* first and
  *entfernt* last.
- **A rich-text tag can hold the number, which is how an animated counter survives the move to ICU.** Those
  banners render the count through `SlidingNumber`, and a plain `{count}` would have dropped the animation.
  The messages write `<b><n>#</n> more days</b>`: `b` is the bold wrapper, `n` renders the counter and
  ignores its chunks, and `#` is the plural's own number, so the tag is still positioned by the translator.
  `manualAdjustments.addedAndRemoved` carries two counts and therefore two tags, `a` and `r`. Tags nest, and
  `#` resolves inside one; both were checked against the real bundles rather than assumed.
- **No currency symbol in any message, and [`../utils/currencies.test.ts`](../utils/currencies.test.ts)
  asserts it over the whole catalogue.** Five of the six locales write `1 €` and only `en` writes `€1`, so a
  glyph baked into a string is on the wrong side for most readers and no translator can move it. The value
  arrives already formatted, as `{amount}`: `amountFormatter` for a whole-euro price in a server component
  (`homepage.pricing.*`, `termsOfService.…maxLiability`) and `useCurrencyFormatter` for a charge in a client
  one. The rule used to be one assertion on `toasts.promoSavedDescription` alone, and four more keys carried
  a glyph the whole time it was green; it walks every bundle now. `homepage.stats.plansValue` was the same
  defect without the symbol, a hand-abbreviated `12k+` written six different ways, and takes
  `format.number(12000, { notation: "compact" })` instead. German reads `12.000+` there, because German CLDR
  has no short form at that magnitude; that is the locale being right, not the formatter being wrong.
- Values are always strings. There are no arrays anywhere in the bundles: a list is a numbered or
  named set of sibling keys, because `next-intl` cannot interpolate into an array.
- `en.json` is the reference. Add a key there first, then to the other five in the same commit.
- **A string that describes an icon is coupled to the module that draws it, and moves with it.**
  `tutorial.steps.alternativesDescription` tells the user the recommended alternative is "marked with a
  sparkle", and [`pages/planner/PlannerPanel.tsx`](../modules/pages/planner/PlannerPanel.tsx) draws a `Sparkles` from `lucide-react`. The Catalan copy
  said **llamp** (a lightning bolt) and carried a `⚡` besides, so one locale in six described a badge the
  app has never rendered. Nothing catches this: key parity compares key sets, and no test reads an icon
  name out of a sentence. When you change an icon, grep the six bundles for its old name; when you write
  copy that names one, name the component that renders it.

  **Catalan was not the only one, because fixing the locale that was reported is not the same as checking
  the other five.** Italian said *icona stellata* and French *marquée d'une étoile*, both a star, on the same
  string; they say *icona a scintilla* and *marquée d'une étincelle* now. German's *Funkelsymbol* was right
  all along. Three of six described an icon the app does not draw, and the earlier fix looked complete
  because it named the locale someone happened to read.
- **The product addresses the user informally, in every locale.** `du` in German, `tu` in French, `tú` in
  Spanish, and the same throughout Catalan and Italian. Eight strings did not: the calendar-export toast
  and the promo confirmation in `de` and `fr` used `Sie`/`Ihr` and `vous`/`votre`/`veuillez` while the
  sibling key one line away stayed informal, so a single user journey switched register mid-sentence.
  [`tests/docs-consistency.test.ts`](../../../../../tests/docs-consistency.test.ts) scans [`de.json`](./messages/de.json) and [`fr.json`](./messages/fr.json) for the formal pronouns now,
  against a named allow-list. Two kinds of hit are legitimate and are listed there by key path: the
  `faq.sections.security` questions, which quote the user addressing **the operator**, and third-person
  `sie` in `cookiePolicy` and `legalNotice`, which means "they"/"it" and is not address at all. Add to that
  list only after checking which of the two you have.

## Invariants

**Every bundle has exactly the keys `en.json` has**: no missing keys, no leftovers. This is asserted
by [`tests/docs-consistency.test.ts`](../../../../../tests/docs-consistency.test.ts), which flattens each file
and diffs it against the reference, so a half-finished translation fails the unit suite rather than
rendering a raw key in production. It reads unstaged files, so it fires before you commit.

**There is no fallback chain to English.** `config.ts` supplies `locale` and `messages` and nothing
else (no `onError`, no `getMessageFallback`), so a key present in `en.json` and missing from [`de.json`](./messages/de.json)
does not quietly fall back: it takes `next-intl`'s default handling, which surfaces the key path in the
UI rather than the copy. The parity test above is what keeps that from reaching production.

## Key names may carry a retired term; the strings may not

[`CONTEXT.md`](../../../../../CONTEXT.md) governs the words the product says, and the root guide calls a retired
name in code or copy a defect. A few **key names** still hold retired terms (`alternativesManager.option` and
`summary.notifications.canImprove.reviewOptions` for Alternative, `alternativesManager.totalOff`
and `totalDaysOff` for Effective Day, `ptoStatus.autoAssigned` for Suggested Day,
`workdayCounter.dateRange` for Planning Window), while the strings behind
them say Alternative, Effective Day, Suggested Day and the selected dates, in all six languages. That split is deliberate: a key is an
identifier no user reads, renaming one means
editing six bundles and every call site, and `tests/docs-consistency.test.ts` asserts key parity across all
six, so a half-finished rename fails the suite rather than the eye. Rename a key only as its own change, all
six bundles at once. **A translated string is different**: it is the product speaking, and it uses the
glossary's word.

## Gotchas

**The whole catalogue ships to the browser.** `src/app/[locale]/layout.tsx` mounts
`NextIntlClientProvider` with no `messages` prop, which hands the client every namespace for the
active locale, about 93 KB of JSON for `en`, more for the others. There is no per-route splitting.
Adding a namespace makes every page heavier, so a large block of copy used by one screen is worth
weighing rather than adding by reflex. Trimming this by rendering more copy on the server is not
available either: the planner is client-side end to end
([ADR 0001](../../../../../adr/0001-planner-runs-in-the-browser.md)), so most of the catalogue has to
reach the browser one way or another.

**A key nothing reads still ships, and nothing fails when it stops being read.** Nine were found orphaned at
once, 54 strings across the six bundles: the whole `command` namespace, whose only key
`searchPlaceholder` no component could ever have read, because
[`core/primitives/Command.tsx`](../modules/core/primitives/Command.tsx) is a `core/` file and may not call
`useTranslations` (its input takes the placeholder as a prop, and every caller passes one from its own
namespace); `sidebar.filters`, `planner.subtitle`, `summary.yearTimeline.title`, `tutorial.description`; and
three FAQ entries. Two of those, `faq.sections.general.howWorks` and `restartTutorial`, were a `question`
with no `answer`: half-deleted, and key parity could not see it because all six bundles were half-deleted
identically. All of the above are gone.

`faq.sections.general.whatIsPto` was the exception and was **wired in rather than deleted**: a complete,
well-written Q and A that [`pages/homepage/sections/Faq.tsx`](../modules/pages/homepage/sections/Faq.tsx)
and [`shared/seo/JsonLd.tsx`](../modules/shared/seo/JsonLd.tsx) simply never listed. It leads the *General*
section now, in both, because the two lists are written out by hand and an entry added to one and not the
other degrades the structured data silently. `planner.subtitle` is the trap in that sweep: it reads like a
duplicate of `planner.description`, which **is** read, by `createTranslator` in
[`buildMarkdownPage.ts`](../../infrastructure/markdown/buildMarkdownPage.ts) for the Markdown twin. Check
which of a near-identical pair has the reader before deleting either.

**[`src/app/global-error.tsx`](../../app/global-error.tsx) is English-only, on purpose.** It static-imports `en.json` alone and sets
`<html lang='en'>` even when the URL says `/de/…`, because global-error sits above the `[locale]`
segment and cannot reach the request config; importing all six catalogues to fix that would add them
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

# apps/web/src/application

## Purpose

Orchestration. This layer decides *what* happens and in what order; `@infrastructure/*` knows how to reach
the thing it happens to, and `@domain/*` holds the rules. Nothing here constructs an SDK client, opens a
socket or reads a request.

It is unusual in one respect: it has a server half and a browser half, and they share almost nothing. The
server half — `use-cases/`, the Zod schemas in `dto/`, [`shared/utils/zodParse.ts`](./shared/utils/zodParse.ts), `email/` — is Effect
programs run at a route handler or a server action. The browser half — `stores/`, `export/`,
[`i18n/navigation.ts`](./i18n/navigation.ts) — is Zustand and plain functions, and it is where most of the product actually lives,
because the planner runs client-side ([ADR 0001](../../../../adr/0001-planner-runs-in-the-browser.md)). The
two halves are joined only by `dto/` and [`shared/utils/dates.ts`](./shared/utils/dates.ts).

## Structure

| Folder | Contents | Runs |
| --- | --- | --- |
| `dto/` | The translation seam between foreign shapes and the glossary. See [`dto/CLAUDE.md`](./dto/CLAUDE.md) | both |
| `stores/` | The five Zustand stores and the storage wrapper. See [`stores/CLAUDE.md`](./stores/CLAUDE.md) | browser |
| `use-cases/` | The four Effect programs that combine more than one service. See [`use-cases/CLAUDE.md`](./use-cases/CLAUDE.md) | server |
| [`email/templates/`](./email/templates) | `Contact.tsx` — the React Email document `sendContactEmail` renders to HTML | server |
| `export/` | [`generateIcs.ts`](./export/generateIcs.ts) builds an RFC 5545 calendar string from Holidays and PTO Days; `utils/sanitizer.ts` escapes the four characters that would break a line; [`utils/serializers.ts`](./export/utils/serializers.ts) holds the two ICS date formats, which live here rather than in the shared date library because nothing else speaks them | browser |
| `i18n/` | `navigation.ts` — `Link`, `useRouter`, `usePathname` bound to the next-intl routing config, so every internal link carries the locale prefix | browser |
| [`shared/dto/`](./shared/dto) | [`baseDTO.ts`](./shared/dto/baseDTO.ts) — the `BaseDTO<INPUT, OUTPUT, PARAMS>` contract every mapper implements | both |
| [`shared/utils/`](./shared/utils) | `dates.ts` — calendar arithmetic, comparison and formatting; [`dateIntake.ts`](./shared/utils/dateIntake.ts) — the two ways a date arrives from outside; `zodParse.ts` — Zod validation lifted into an Effect that fails with `ValidationError`; [`collate.ts`](./shared/utils/collate.ts) — `collateByLabel`, the one place a localised option list is ordered | `dates.ts`, `dateIntake.ts` and `collate.ts` both, `zodParse.ts` server |

## Layer rules

May import from `@domain/*` and `@infrastructure/*`. Must not import React components, build a
`NextResponse`, or reach for `getCloudflareContext()` — configuration arrives as plain values
([ADR 0004](../../../../adr/0004-cloudflare-workers-as-deployment-target.md)).

**Two files import from `@ui/*`, inverting the dependency.** [`stores/premium.ts`](./stores/premium.ts) uses
`@ui/adapters/session/checkSession`, and [`stores/ui.ts`](./stores/ui.ts) uses `@ui/utils/currencies`. Both are noted in
[`../ui/CLAUDE.md`](../ui/CLAUDE.md) as known and not endorsed; check before moving either target file. Do
not add a third.

**No SDK is constructed here.** Stripe, Turso and Resend arrive as Effect service tags that the caller
provides ([ADR 0002](../../../../adr/0002-effect-for-external-service-boundaries.md)), so a use-case stays
substitutable in tests. The one exception is logging: the stores log against the BetterStack singleton rather
than a tag, because a Zustand action has no Effect context to yield one out of. They reach it through a
`void import(...)` helper declared in each file — never a static import and never a module-scope `logger`,
because that client's own top-level imports would land in the client chunk of every component that reads a
store. Both halves of that exception are deliberate; see [`stores/CLAUDE.md`](./stores/CLAUDE.md).

**[`email/templates/Contact.tsx`](./email/templates/Contact.tsx) is the only React in the layer**, and it is not DOM React — its elements
come from `@react-email/components` and it is rendered to a string by `render()` inside `sendContactEmail`.
Tailwind classes on it are compiled by React Email's own `Tailwind` wrapper, not by the app's stylesheet.

None of this is lint-enforced. Biome has no import-boundary rule; these are conventions upheld in review.

## Dates

`shared/utils/dates.ts` is the app's date library — there is no `date-fns` and no second implementation of
the arithmetic. Every function converts to `Temporal.PlainDate`, does the work there and converts back
([ADR 0005](../../../../adr/0005-temporal-polyfill.md)); `dateIntake.ts` beside it is the only other file on
this side of the tree that imports `temporal-polyfill`.

Two consequences worth holding on to:

- **Every `Date` this layer produces is local midnight**, built with `new Date(y, m, d)`. There is no time
  component and no UTC anywhere. Comparing with `toISOString()` across a time zone will shift the day;
  compare with `isSameDay`, `compareAsc` or `isWithinInterval` instead.
- **A date arriving from outside goes through `dateIntake.ts`, and which function you want is a question
  about the source, not about the type.** The module has exactly two entry points and they are named for
  their contracts, because they are not interchangeable:
  - `fromUpstreamCalendarDay(value)` — the source named a **calendar day**. It keeps the leading
    `YYYY-MM-DD` and drops whatever follows.
  - `fromStoredInstant(value)` — this app wrote the value with `toISOString()`, so the **instant** is the
    thing being round-tripped, and `new Date()` is correct.

  They used to be `toLocalDay` and `ensureDate`, two similarly-generic names sharing one flat namespace with
  thirty other date helpers, both `Date | string → Date`, and picking the wrong one is a real bug that
  shipped: `date-holidays` emits its Islamic-calendar entries with an explicit offset —
  `'2027-03-09 00:00:00 -0600'` — and `new Date()` reads that as a fixed instant, `06:00Z`, which is still
  8 March for anyone at UTC−07:00 or further west. `holidayDTO.create` used the instant parser, so Eid
  al-Fitr landed a day early for a visitor in Denver, Los Angeles, Anchorage or Honolulu: the planner
  protected the wrong day and placed a PTO Day on the real Holiday. [`dateIntake.test.ts`](./shared/utils/dateIntake.test.ts) pins that the two
  answer differently for the same string, which is the whole reason they are two functions.
- **`formatDate` understands exactly the patterns in its map, and the compiler now says so.** `format` is
  typed `DateFormat` — the keys of `INTL_FORMAT_MAP` plus the two ISO forms — so an unrecognised pattern is a
  compile error. It used to be `string` with a `toLocaleDateString` fall-through that silently ignored the
  pattern and returned plausible-looking wrong output, and that branch is gone.

  **This is also the only place an `Intl.DateTimeFormat` is constructed and memoised.** Six files had routed
  around the whitelist and rebuilt both halves — five private `Map<string, Intl.DateTimeFormat>` caches plus
  two uncached `toLocaleDateString` calls — and three of those constructed option objects byte-identical to
  entries already in the map. The map gained `'MMM'` and `'EE, MMM d'`, which is all the six needed, and the
  caches are gone. A caller wanting a new combination adds a row here rather than a sixth cache.

Weekday numbers are ISO throughout: `Temporal.PlainDate`'s `dayOfWeek` runs 1 (Monday) to 7 (Sunday), which
is why `isWeekend` tests for 6 and 7. The `weekStartsOn` option is the date-fns convention instead — 0 for
Sunday through 6 for Saturday — so `startOfWeek` and `endOfWeek` normalise it with
`options?.weekStartsOn || 7`: 0 is falsy, so Sunday falls through to the ISO 7, and 1–6 already agree between
the two conventions. `getWeekdayNames` anchors on `new Date(2023, 0, 2)` because that date is a Monday and
the function walks seven days from the start of its week; a different anchor rotates every localised weekday
header.

**Two exports are gone and should not come back.** `differenceInCalendarDays` was byte-identical to
`differenceInDays` — both operate on `PlainDate`, so there is no partial day for them to disagree about — and
had one caller, kept only so a call site read the way its date-fns predecessor did. `isInSelectedRange` was a
pure alias of `isWithinInterval` with the two bounds renamed, had **no** caller outside its own five tests,
and actively misled: `HolidayDTO.isInSelectedRange` is computed by `isInPlanningWindow` in
[`dto/holiday/dto.ts`](./dto/holiday/dto.ts), not by this. A rename of two parameters is not a module.

## Gotchas

**`zodParse.ts` is server-only despite living under `shared/`.** It requires `LoggerService` in its Effect
context, so calling it from a store or a component will not compile. Browser-side validation goes through the
schema factories in `dto/` instead — `createContactSchema`, `createPaymentSchemaWithMessages` — which take
translated messages and hand back a schema the form parses itself.

**The two payment mappers disagree about the unit of `amount`, deliberately** — see
[`dto/CLAUDE.md`](./dto/CLAUDE.md). Anything summing or formatting a payment needs to know which one it
holds.

**Escaping and folding are properties of a content line, not of a call site.** RFC 5545 has one rule for
every property: escape the value, then fold anything past 75 **octets** onto a continuation line.
`contentLine(name, value)` in [`export/utils/sanitizer.ts`](./export/utils/sanitizer.ts) does both, and `buildEvent` is a list of calls to
it — `X-WR-CALNAME`, `UID` and `CATEGORIES` included.

It used to be `sanitize`, applied by hand at `SUMMARY` alone, which is why this guide carried "if
`X-WR-CALNAME` ever becomes user-typed it needs the same treatment" as an instruction to a future reader.
Folding was absent entirely and unasserted, and a Custom Holiday name is user-typed and unbounded, so a long
one produced a line a strict parser is entitled to reject. `sanitize` also handled `\n` but not `\r`, so a
pasted CRLF left a bare carriage return inside a value. The fold counts octets rather than characters —
`é` is two — which is what makes it correct for the non-English names this app is full of.

**`DTSTAMP` is required on every `VEVENT`, and it was missing.** RFC 5545 lists it alongside `UID` as
mandatory; without it a strict parser is entitled to reject the file, and the ones that accept it have no
"when was this written" to order revisions by. One stamp is computed per call so every event in a download
shares it.

**A `UID` must be unique across every calendar it might land in, not just within one file.** It was
`holiday-${holiday.id}`, and `holiday.id` is `national-<upstream date>` — the same string for the same day in
every country. Importing a Spanish and a French export into one calendar therefore silently dropped events:
the second New Year's Day overwrote the first. UIDs are now scoped by Country and Region, which is why
`generateIcs` takes them and [`CalendarExport.tsx`](../ui/modules/sidebar/components/CalendarExport.tsx) widened its filters selector to pass them. They also run
through `toUidToken`, which strips everything outside `[a-zA-Z0-9-]`: the id embeds the raw upstream date,
which carries a space and sometimes a UTC offset, and a space inside a `UID` is what content-line folding
eats first.

**`email/templates/Contact.tsx` encodes both halves of its `mailto:`.** The reply button's `href` was
`mailto:${email}?subject=Re: ${subject}`, and `subject` is whatever the sender typed — so `&bcc=` in a
subject line added a recipient to the operator's reply the moment they clicked it. Both the address and the
subject go through `encodeURIComponent` now. Anything else appended to that URL has to as well.

**Pin that one on the `href`, never on the whole document.** The rendered email prints the raw subject twice
as ordinary text — in the preview block and beside the "Subject:" label — and React escapes `&` to `&amp;`
in both, so a document-wide `expect(html).not.toContain('&bcc=')` passes whatever the template does, and
`not.toContain('&amp;bcc=')` fails even when the template is right. [`Contact.test.tsx`](./email/templates/Contact.test.tsx) extracts the reply
button's `href` with a regex and asserts on that string alone. Both assertions were checked by reverting the
template and watching them go red.

## Logging a failed write

**Never log an email address; log `emailDomain(email)`.** That rule was written out at nine sites as
`email?.split('@')[1]` — in both use-cases that defer a write, the premium store and the checkout adapter,
twice on a value already narrowed to non-null. [`shared/utils/redact.ts`](./shared/utils/redact.ts) owns it now, and its test pins the
part that matters: a value with no `@` answers `undefined` rather than falling back to the whole string, so a
malformed address cannot leak through the redaction.

**The severity follows whether there is a backstop, not which file the log sits in.** A deferred write that
fails is logged and swallowed — the error channel is `never`, because the response has already gone out. What
differed was the level: [`payment.ts`](./use-cases/payment.ts) warned "will use webhook fallback", [`activatePremium.ts`](./use-cases/activatePremium.ts) errored, and
both write the same payments row through the same repository with the same Stripe webhook behind them. They
both warn now. [`contact.ts`](./use-cases/contact.ts) keeps `error` and that is the distinction: a lost contact write has no backstop,
so it is genuinely lost.

There is deliberately no `deferWrite` combinator. The three bodies compose differently — one is
`Effect.suspend` over a single `catchAll`, one an `Effect.gen` with `tap`/`tapError`/`catchAll` over two
writes — so a shared helper would need the message, the severity and the shape as parameters, which is as
much interface as implementation.

## Testing

Every module has a co-located `.test.ts`, with the type-only DTO folders as the deliberate exception (see
[`dto/CLAUDE.md`](./dto/CLAUDE.md)). Three patterns split by half:

- **Use-cases** build a `TestLayer` of `Layer.succeed(Tag, mock)` and assert the deferred effect separately
  from the critical path.
- **Stores** mock the storage wrapper, the logging client and every dynamically imported module, then drive
  the store through `getState()`.
- **DTOs and `shared/utils/`** are pure and are tested with literal inputs and no mocks at all.

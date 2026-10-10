# apps/web/src/application

## Purpose

Orchestration. This layer decides *what* happens and in what order; `@infrastructure/*` knows how to reach
the thing it happens to, and `@domain/*` holds the rules. Nothing here constructs an SDK client, opens a
socket or reads a request.

It is unusual in one respect: it has a server half and a browser half, and they share almost nothing. The
server half (`use-cases/`, [`shared/utils/zodParse.ts`](./shared/utils/zodParse.ts), `email/`) is Effect
programs run at a route handler or a server action. The browser half (`stores/`, `export/`,
[`i18n/navigation.ts`](./i18n/navigation.ts)) is Zustand and plain functions, and it is where most of the product actually lives,
because the planner runs client-side ([ADR 0001](../../../../adr/0001-planner-runs-in-the-browser.md)). The
halves share `dto/` and `shared/`, apart from `zodParse.ts` (server) and [`shared/utils/clientLog.ts`](./shared/utils/clientLog.ts) (browser).

## Structure

| Folder | Contents | Runs |
| --- | --- | --- |
| `dto/` | The translation seam between foreign shapes and the glossary. See [`dto/AGENTS.md`](./dto/AGENTS.md) | both |
| `stores/` | The Zustand stores and the storage wrapper. See [`stores/AGENTS.md`](./stores/AGENTS.md) | browser |
| `use-cases/` | The Effect programs that combine more than one service. See [`use-cases/AGENTS.md`](./use-cases/AGENTS.md) | server |
| [`email/templates/`](./email/templates) | `Contact.tsx`, the React Email document `sendContactEmail` renders to HTML | server |
| [`email/palette.ts`](./email/palette.ts) | `EMAIL_PALETTE`, the template's colours: a token module, since a mail client reads no custom property | server |
| `export/` | [`generateIcs.ts`](./export/generateIcs.ts) builds an RFC 5545 calendar string from Holidays and PTO Days; `utils/sanitizer.ts` turns a property into an escaped, folded content line; [`utils/serializers.ts`](./export/utils/serializers.ts) holds the ICS date formats, which live here rather than in the shared date library because nothing else speaks them | browser |
| `i18n/` | `navigation.ts`: `Link`, `useRouter`, `usePathname` bound to the next-intl routing config, so every internal link carries the locale prefix | browser |
| [`shared/dto/`](./shared/dto) | [`baseDTO.ts`](./shared/dto/baseDTO.ts), the `BaseDTO<INPUT, OUTPUT, PARAMS>` contract every mapper implements | both |
| [`shared/utils/`](./shared/utils) | `dates.ts`: calendar arithmetic, comparison and formatting; [`dateIntake.ts`](./shared/utils/dateIntake.ts): the ways a date arrives from outside; `zodParse.ts`: Zod validation lifted into an Effect that fails with `ValidationError`; [`collate.ts`](./shared/utils/collate.ts): `collateByLabel`, the one place a localised option list is ordered; [`redact.ts`](./shared/utils/redact.ts): `emailDomain`, the one form an address takes in a log; `clientLog.ts`: `logClient` and `logClientError`, the browser's way to the `logger` | `zodParse.ts` server, `clientLog.ts` browser, the rest both |

## Layer rules

May import from `@domain/*` and `@infrastructure/*`; configuration arrives as plain values
([ADR 0004](../../../../adr/0004-cloudflare-workers-as-deployment-target.md)).

**One file imports from `@ui/*`, inverting the dependency**: [`stores/premium.ts`](./stores/premium.ts) uses
`@ui/adapters/session/checkSession`, so moving that target file moves this import too; [`../ui/AGENTS.md`](../ui/AGENTS.md)
notes it from the other side.

Stripe, Turso and Resend arrive as Effect service tags that the caller provides
([ADR 0002](../../../../adr/0002-effect-for-external-service-boundaries.md)). Logging is the exception: a Zustand
action has no Effect context to yield a tag out of, so the stores log through `logClient` and `logClientError` in
`shared/utils/clientLog.ts`, which import the plain `logger` dynamically; see [`stores/AGENTS.md`](./stores/AGENTS.md).

**[`email/templates/Contact.tsx`](./email/templates/Contact.tsx) is the only React in the layer**, and it is not DOM React: its elements
come from `react-email`, the one package that also exports the `render()` that turns it into a string inside
`sendContactEmail`. Tailwind classes on it are compiled by React Email's own `Tailwind` wrapper, not by the app's
stylesheet, and the wrapper's theme takes its colours from [`email/palette.ts`](./email/palette.ts). **`Hr` writes its
own grey `border-top` after the `border-color` a class gives it**, so the rule names its top edge as well
(`border-t-email-line`), and `Contact.test.tsx` resolves the colour that edge ends up with.

[`tests/docs-consistency.test.ts`](../../../../tests/docs-consistency.test.ts) counts every cross-layer import
against the table on the wiki's architecture overview, so a new edge fails it until that table changes.

## Dates

`shared/utils/dates.ts` is the app's date library: there is no `date-fns` and no second implementation of
the arithmetic. The arithmetic converts to `Temporal.PlainDate`, does the work there and converts back
([ADR 0005](../../../../adr/0005-temporal-polyfill.md)), except where a round trip per call is the cost that
matters; `dateIntake.ts` beside it is the only other file on this side of the tree that imports `temporal-polyfill`.

**`isSameDay`, `isSameMonth` and `isWeekend` read the local year, month, day or weekday directly**, which is
the same answer: the planner's calendar calls them for every cell on every render. `startOfToday` reads the
clock the same way.

**`dayIndex`, `fromDayIndex`, `isWeekendIndex` and `eachDayOfInterval` are arithmetic, not dates.** `dayIndex`
turns a calendar day into an integer (days since 1 January 1970, read from the local year, month and day through
`Date.UTC`), `fromDayIndex` turns it back into local midnight, `isWeekendIndex` answers from the integer alone,
and `eachDayOfInterval` walks the integers. The planning engine counts in them inside loops that run once per
candidate per pick, where a `Temporal.PlainDate` round trip per comparison is the cost that matters; no `Date`
with a time component and no UTC instant ever leaves them.
`dates.test.ts` pins that they round-trip across both daylight-saving changes with the zone set to
Europe/Madrid, since a UTC runner could not tell a wrong implementation from a right one.

Consequences worth holding on to:

- **Every calendar day this layer produces is a `Date` at local midnight**, built with `new Date(y, m, d)`, so
  `toISOString()` shifts it across a time zone. Payment timestamps (`stripeCreatedAt`) are instants, and nothing
  compares them as days.
- **`dateIntake.ts`'s entry points are named for their sources, and they are not interchangeable:**
  - `fromUpstreamCalendarDay(value)`: the source named a **calendar day**. It keeps the leading
    `YYYY-MM-DD` and drops whatever follows.
  - `fromStoredInstant(value)`: this app wrote the value with `toISOString()`, so the **instant** is the
    thing being round-tripped, and `new Date()` is correct.

  `date-holidays` emits some entries with an explicit offset (`'2027-03-09 00:00:00 -0600'`), and `new Date()`
  reads that as a fixed instant, which is still 8 March for anyone at UTC−07:00 or further west: the instant
  parser would protect the wrong day and let a PTO Day land on the real Holiday.
  [`dateIntake.test.ts`](./shared/utils/dateIntake.test.ts) pins that the two answer differently for the same
  string, which is the whole reason they are separate functions.
- **`formatDate` understands exactly the patterns in its map.** `format` is typed `DateFormat` (the keys of
  `INTL_FORMAT_MAP` plus the ISO forms), so an unrecognised pattern is a compile error, and it memoises every
  `Intl.DateTimeFormat` it builds. `getWeekdayNames` and `getMonthNames` go through it (the private `WEEKDAY_FORMAT` and
  `MONTH_FORMAT` maps translate their public `format` into a pattern), and `dates.test.ts` pins the memo by
  counting `Intl.DateTimeFormat` constructions through a passthrough spy. `formatDateParts` takes the same pattern
  keys, without the ISO forms, and returns the `Intl` parts of one date from the same memo, so a header that styles
  one part (the month header styles the year) formats the date once and lets the locale order and join its parts.

Two weekday conventions meet here. Temporal's `dayOfWeek` is ISO, 1 (Monday) to 7 (Sunday); `isWeekend`,
`isWeekendIndex` and the `weekStartsOn` option use the JavaScript one, 0 (Sunday) to 6 (Saturday), which is
why both weekend tests look for 0 and 6. `startOfWeek` and `endOfWeek` bridge them with
`options?.weekStartsOn || 7`: 0 is falsy, so Sunday falls through to the ISO 7, and 1–6 already agree between
the two conventions. `getWeekdayNames` anchors on `new Date(2023, 0, 2)` because that date is a Monday and
the function walks seven days from the start of its week; a different anchor rotates every localised weekday
header.

## Gotchas

**`zodParse.ts` is server-only despite living under `shared/`.** It requires `LoggerService` in its Effect
context, so calling it from a store or a component will not compile. Browser-side validation goes through the
schema factories in `dto/` instead (`createContactSchema`, `createDonationFormSchemaWithMessages`), which take
translated messages and hand back a schema the form parses itself.

**The payment mappers disagree about the unit of `amount`, deliberately**; see
[`dto/AGENTS.md`](./dto/AGENTS.md). Anything summing or formatting a payment needs to know which one it
holds.

**Escaping and folding are properties of a content line, not of a call site.** RFC 5545 has one rule for
every property: escape the value, then fold anything past 75 **octets** onto a continuation line.
`contentLine({ name, value })` in [`export/utils/sanitizer.ts`](./export/utils/sanitizer.ts) does both, and every
line built from data goes through it: all of `buildEvent`'s, `UID` and `CATEGORIES` included, and `X-WR-CALNAME`
in the envelope. A Custom Holiday name is user-typed and unbounded, and the fold counts octets rather than
characters (`é` takes more than one), which is what keeps a long non-English name inside the limit.

**Every `VEVENT` carries `DTSTAMP` and `UID`, which RFC 5545 makes mandatory.** One stamp is computed per call,
so every event in a download shares it.

**A `UID` must be unique across every calendar it might land in, not just within one file.** `holiday.id` is
`national-<upstream date>`, the same string for the same day in every Country, so two exports imported into
one calendar would overwrite each other's events. UIDs are scoped by Country and Region, which is why
`generateIcs` takes them and [`CalendarExport.tsx`](../ui/modules/sidebar/components/CalendarExport.tsx) passes them. They also run
through `toUidToken`, which strips everything outside `[a-zA-Z0-9-]`: the id embeds the raw upstream date,
which carries a space and sometimes a UTC offset, and a space inside a `UID` is what content-line folding
eats first.

**`email/templates/Contact.tsx` encodes both halves of its `mailto:`.** `subject` is whatever the sender
typed, so an unencoded `&bcc=` in a subject line would add a recipient to the operator's reply. The address and
the subject go through `encodeURIComponent`; anything else appended to that URL has to as well.

**Pin that one on the `href`, never on the whole document.** The rendered email prints the raw subject twice
as ordinary text (in the preview block and beside the "Subject:" label), and React escapes `&` to `&amp;`
in both, so a document-wide `expect(html).not.toContain('&bcc=')` passes whatever the template does, and
`not.toContain('&amp;bcc=')` fails even when the template is right. [`Contact.test.tsx`](./email/templates/Contact.test.tsx) extracts the reply
button's `href` with a regex and asserts on that string alone.

**The logo `src` is `/static/images/…`.** `public/static/` holds one subdirectory, `images/`, and
[`next.config.ts`](../../next.config.ts) declares no rewrite. Besides the assertions on the literal,
`Contact.test.tsx` resolves the rendered `src` against `public/` on disk, so a path naming no file fails
whatever literal the others hold; [`../app/AGENTS.md`](../app/AGENTS.md) records the same vacuous-fixture
pattern for `check-session` and `health`.

## Logging a failed write

`emailDomain(email)` in [`shared/utils/redact.ts`](./shared/utils/redact.ts) answers `undefined` for a value with no
`@` rather than the whole string, so a malformed address cannot leak through the redaction.

A deferred write that fails is logged and swallowed: its error channel is `never`, because the response has already
gone out. The payments row that [`payment.ts`](./use-cases/payment.ts) and [`activatePremium.ts`](./use-cases/activatePremium.ts) save, and the
move of that row to `succeeded` the activation makes, have the Stripe webhook behind them, so a failed save or a failed
status update warns; [`contact.ts`](./use-cases/contact.ts) logs `error`, because a lost contact write has no backstop.

## Testing

Every module with behaviour has a co-located `.test.ts(x)` except three that the store suites exercise instead:
`stores/rehydration.ts`, `holidaysKeyOf` in `stores/types.ts` and `isHolidayVariant` in `dto/holiday/types.ts`.
The type-only files have none (see [`dto/AGENTS.md`](./dto/AGENTS.md)). Use-case tests assert the deferred effect
separately from the critical path; store tests mock the storage wrapper, the logging client and every dynamically
imported module, then drive the store through `getState()`; `dates.test.ts` spies on `Intl.DateTimeFormat` only to
count constructions, and `clientLog.ts`'s test mocks the logger module.

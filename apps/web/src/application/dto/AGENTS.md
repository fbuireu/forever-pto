# apps/web/src/application/dto

## Purpose

The translation seam between external shapes and the vocabulary in [`CONTEXT.md`](../../../../../CONTEXT.md). A holiday arrives from `date-holidays` as a `RawHoliday`, a payment arrives from Stripe as a `PaymentIntent`, a country list arrives from `i18n-iso-countries` as a map of code to name. Nothing downstream should have to know any of that. A DTO takes the foreign shape in and hands back the canonical one (`HolidayDTO`, `PaymentData`, `CountryDTO`), so stores, use-cases, the domain and the UI only ever speak the glossary.

The rest of the application layer contract is in [`../AGENTS.md`](../AGENTS.md).

## One folder per concept

Each concept gets its own folder, and the file names inside it are fixed:

| File | Role | Present in |
| --- | --- | --- |
| `types.ts` | The canonical shape, plus the `Raw*` alias for the foreign one it is built from | every folder |
| `dto.ts` | The mapper, the object implementing `BaseDTO`; `holiday/` and `payment/` also export predicates over what it produces (`holidaysInPlanningWindow`, `hasSucceeded`, `wasCharged`) | `country/`, `holiday/`, `payment/`, `region/` |
| `schema.ts` | A Zod schema for a shape the *user* submits (a form, a query string), or for a body this app's own endpoint answers that the browser has to check, and the `z.infer` type derived from it | `contact/`, `payment/`, `premium/` |
| `utils/` | Helpers the mappers need and nothing outside this folder reaches for; `holidayDTO` uses `region/`'s | `payment/`, `region/` |
| `rules.ts` | Pure rules over the concept that are not a mapping | `contact/` |

Not every folder needs every file. `email/` is `types.ts` alone and `premium/` has no `dto.ts`: `SendEmailParams` and `PremiumSessionClaims` are contracts between our own layers, with no foreign shape to normalise and therefore no mapper to write. `premium/schema.ts` exists because the `/api/check-session` bodies arrive in the browser as `unknown` JSON, and a contract between our own layers is still a wire the browser cannot take on trust.

| Folder | Canonical shape | Built from |
| --- | --- | --- |
| `contact/` | `ContactData`, `ContactFormData`, plus `rules.ts` | the contact form |
| `country/` | `CountryDTO` | `i18n-iso-countries` localised names |
| `email/` | `SendEmailParams` | None |
| `holiday/` | `HolidayDTO` | `date-holidays` |
| `payment/` | `PaymentConfirmationDTO`, `NewPayment` (what `paymentDataDTO` produces) and `PaymentData` (the stored record it grows into), `CreatePaymentInput`, `CreatePaymentResult`, `DiscountInfo`, the `PromoCodeErrors` a refused promo code answers with, and in `schema.ts` the confirmation page's query with the `ACTIVATION_PARAM` and `ACTIVATION_FAILED` the activation route writes | Stripe `PaymentIntent`, the donation form |
| `premium/` | `PremiumSessionClaims`, what the session cookie's token signs (`email`, `paymentIntentId`), plus `PremiumSession`, the same session as `/api/check-session` answers it and the browser keeps it (`premiumKey`, `email`), and the route's other body schemas in `schema.ts` | None |
| `region/` | `RegionDTO` | `i18n-iso-countries` localised names |

## Public API

Every mapper implements `BaseDTO` from [`../shared/dto/baseDTO.ts`](../shared/dto/baseDTO.ts):

```typescript
type BaseDTO<INPUT, OUTPUT, PARAMS = undefined> = [PARAMS] extends [undefined]
  ? { create: (args: { raw: INPUT }) => OUTPUT }
  : { create: (args: { raw: INPUT; params: PARAMS }) => OUTPUT };
```

**The shape depends on whether the mapper declared a `PARAMS` type, so the requirement is stated once.**
`holidayDTO` and `paymentDataDTO` need params (there is no sane default for a Planning Window or for the
request metadata attached to a Donation), and omitting them is a compile error. `countryDTO`, `regionDTO` and
`paymentConfirmationDTO` declare none and cannot be handed a spurious one. A mapper's `create` takes its
parameter types from that annotation rather than restating them.

`holidayDTO` widens `BaseDTO` with extra entry points:

- `createCustom`: builds a Custom Holiday from what the user typed, rather than from upstream data. It
  takes no `locale`: its id is an ISO datetime, built by `isoDateTime`.

**Every producer of a `HolidayDTO` hands back a real `Date`**: `create`, `createCustom`, the worker's
`deserializeHolidays` and the rehydration revive in [`../stores/holidays.ts`](../stores/holidays.ts), which reads the
persisted shape as `Stored<T>` from [`../shared/utils/dateIntake.ts`](../shared/utils/dateIntake.ts) and revives each
date through `fromStoredInstant`. [`holidays.test.ts`](../stores/holidays.test.ts) round-trips a persisted Holiday through a real
`JSON.parse(JSON.stringify(...))` and asserts `state.holidays[0].date` comes back `instanceof Date`.

**`isHolidayVariant` is where the sealed union is re-established, and it exists because `HolidayVariant`
crosses a boundary the app does not control.** Persisted store state is obfuscated, not encrypted
([ADR 0007](../../../../../adr/0007-persisted-client-state-is-obfuscated-not-encrypted.md)), so the `variant`
of a stored Holiday is a string a user can edit and a string an older build may have written. The readers
compare against a member of the union, so a value outside it fails nowhere: the Holiday drops out of the
counts, the charts and the table while still occupying its date and still blocking a PTO Day.
`onRehydrateStorage` in [`../stores/holidays.ts`](../stores/holidays.ts) drops the entry instead. It lives beside the union rather than in a
`rules.ts` because it is the union's own membership test, which is what `isFilterStrategy` is to
`FilterStrategy` in [`../../domain/calendar/types.ts`](../../domain/calendar/types.ts).

**`Raw*` types reach exactly one place outside this folder.** `RawHoliday` is named across the files under
[`../../infrastructure/services/holidays/source/`](../../infrastructure/services/holidays/source), which is
the adapter that *produces* the shape and hands it to `holidayDTO.create`. That is the upstream side of this
seam, and a foreign type has to be spellable there or the adapter cannot type its own output. `RawCountry`
and `RawRegion` reach nothing outside this folder at all.

[`tests/docs-consistency.test.ts`](../../../../../tests/docs-consistency.test.ts) fails on any `Raw*` name on the
other side of the mapper: under `application/stores/`, `ui/`, `app/`, `application/use-cases/` or `domain/`.

**`contact/rules.ts` holds the sender identity, and it is not `normalizeEmail`.** The contact guard keys on
`contactSenderKey`, which lowercases, trims **and strips a `+alias` from the local part**, so
`someone+forever-pto@example.com` and `someone@example.com` are one sender. That last step is the whole
point: without it, the guard is bypassed by typing a different alias, which costs the sender nothing.

It deliberately does **not** widen `@infrastructure/services/payments/normalizeEmail`, which only lowercases
and trims. Premium recovery is keyed by email through `getSucceededPaymentByEmail`'s
`lower(trim(email)) = ?`, so stripping aliases there would change who can recover an entitlement: a
different decision, on a different table, that this one must not smuggle in.

## `HolidayDTO` crosses into the domain

`stripe`, `date-holidays` and `i18n-iso-countries` appear here only as `import type`, which is what lets `HolidayDTO` cross into the domain. The pure calendar context imports `@application/dto/holiday/types` directly, which is a layering inversion on paper: the type describes a Holiday, so it belongs in the domain. It is a known pragmatic exception (moving it means touching every calendar module and its tests), and it is safe only because everything in the file is evaluable inside a Web Worker with no DOM: types, one const object, and `isHolidayVariant`, which is `Object.values` over that const object and reaches nothing else. See [ADR 0003](../../../../../adr/0003-pure-calendar-domain-effectful-payment-domain.md) and [`../../domain/calendar/AGENTS.md`](../../domain/calendar/AGENTS.md). If anything with a runtime dependency is ever added to [`holiday/types.ts`](./holiday/types.ts), the planner breaks in the worker and no server-side test will catch it.

`RegionDTO` also crosses outwards, but downwards only: `holidayDTO.create` takes the region list so `getRegionName` can turn a region code into a display label. No domain code imports it.

## Gotchas

**The payment mappers disagree about the unit of `amount`, deliberately.** `paymentConfirmationDTO` divides by 100 because it feeds a screen; `paymentDataDTO` keeps Stripe's minor units because it feeds the payments table. Both are built from the same `PaymentIntent`. Check which one you are holding before formatting or summing.

**`holidayDTO.create` sorts twice, and the first sort is not chronological.** It compares nothing but the `location` flag, so Regional entries land after National ones and the `processedDates` dedupe keeps the National Holiday when both fall on the same date. Because that comparator is a real ordering, the sort stays stable: entries of the same variant on the same date survive in the order upstream listed them, whatever the length of the list. The chronological sort happens at the end of the reduce.

**`HolidayDTO.isInPlanningWindow` is a snapshot, so whoever carries a Holiday across a window change has to
recompute it.** `isInPlanningWindow` the predicate is called by `create` and `createCustom`, and by the
holidays store, which preserves Custom Holidays verbatim through a `fetchHolidays` and would otherwise keep
the flag from the year they were created in.

**The reason to recompute it is display, not Bridge anchoring.** `createHolidaySet` applies no window filter,
and no code under `@domain/calendar/` reads the flag; the one write there is `runPlanningPipeline` stamping
`true` on each `manual-N` pseudo-Holiday. The readers are the display: `holidaysInPlanningWindow` in
[`holiday/dto.ts`](./holiday/dto.ts) (the Summary and the calendar export), the Holidays table and the
calendar's per-month count.

**The bounds live in [`../../domain/calendar/window.ts`](../../domain/calendar/window.ts).**
`planningWindowInterval` and `isInPlanningWindow` sit beside `planningWindowMonths`, which is the other
projection of the same `{ year, carryOverMonths }` and has to describe the same span; `window.test.ts` relates
them. The predicate takes the interval as a value (`isInPlanningWindow({ date, window })`), built once per
call site with `planningWindowInterval`.

**`create`'s keep window is derived, not written twice.** `MAX_CARRY_OVER_MONTHS` in `window.ts` is also the
clamp ceiling in `filters.ts`, and this mapper builds its keep window as
`planningWindowInterval({ year, carryOverMonths: MAX_CARRY_OVER_MONTHS })`, the widest window the Holiday
source can fill. [`dto.test.ts`](./holiday/dto.test.ts) pins that coupling with a Holiday on the last day the
widest window covers and one on the day after. It derives both dates from the constant the mapper reads, so
it guards the derivation, and [`window.test.ts`](../../domain/calendar/window.test.ts) pins the value.

**There is a keep window and a display window, not one window.** `create` drops anything outside the widest Planning Window the data supports (`MAX_CARRY_OVER_MONTHS`, so the chosen year plus the whole of the following one), then sets `isInPlanningWindow` from the *actual* Planning Window (the year plus its Carry-over Months). Holidays between them are kept so the UI can show them for context. They are not hidden from the engine: it plans against the unfiltered set on purpose, and the flag is read only by the display filters listed above.

**Schemas carry message keys, not messages.** `contactSchema` and `createPaymentSchema` are pre-bound with keys such as `invalid_email` for server-side validation. The UI calls `createContactSchema` / `createDonationFormSchemaWithMessages` with translated strings instead. Adding a validation rule means adding it to the messages interface too, or the localised form silently loses the message.

**The Donation form holds the amount as `number | null`, and its schema converts it.** `createDonationFormSchemaWithMessages` is `createPaymentSchemaWithMessages` with `amount` read through `amountFromField`, which reads `null` as 0. `null` is an emptied field or text `NumberInput` cannot read, so the field keeps what the visitor types (empty stays empty, because `NumberInput` owns the text and reports `null` rather than `0`) and an empty submit, like an unreadable one, still fails on the minimum's own message rather than Zod's prose. The server's `createPaymentSchema` keeps `amount` a number, because the body `POST /api/payment` reads is JSON the client already converted ([ADR 0021](../../../../../adr/0021-numbers-a-visitor-types-are-localised-text-fields.md)).

**The body and query schemas are checked with `.validate()`, never parsed, because every caller only needs yes or
no.** `premium/schema.ts` (`premiumSessionSchema`, `premiumKeySchema`, `noPremiumSessionSchema`,
`activationFailureSchema`) and `paymentConfirmationQuerySchema` in [`payment/schema.ts`](./payment/schema.ts) are read
with zod's `validate`, which answers a boolean, builds no issue list and narrows the value it was handed rather than
returning a copy. Two things follow. Nothing is transformed, defaulted or coerced, so a schema here must not grow
`.transform`, `.default` or `.catch` and expect `validate` to apply it: that is `parse`'s job and `zodParse`'s. And
extra keys pass through, so a caller copies the fields it needs (`{ premiumKey: body.premiumKey, email: body.email }`)
rather than handing the validated body on. What each caller does with a *no* is the caller's decision and is recorded
beside it: [`../../ui/AGENTS.md`](../../ui/AGENTS.md) for the two adapters, [`../../app/AGENTS.md`](../../app/AGENTS.md)
for the confirmation page.

**`premium/schema.ts` is loaded lazily by one of its two importers, and that is what keeps zod off the first load.**
[`checkSession.ts`](../../ui/adapters/session/checkSession.ts) is in the first-load chunk of every page, through the
premium store, and zod is in none of them; a static import would add zod classic, roughly 25 KB compressed at the
smallest measured, to every visit. It reaches the schemas through `import()` inside the functions that already await a
fetch. [`checkout.ts`](../../ui/adapters/payments/checkout.ts) imports them statically: its importers are
[`Donate.tsx`](../../ui/modules/shared/donate/Donate.tsx) and the `CheckoutForm.tsx` it renders, and `Donate.tsx`
already loads zod through `payment/schema.ts`. Keep the dynamic form, and keep anything heavier than `zod` out of this
file.

**The bounds are exported, so the copy can interpolate them.** `AMOUNT_MIN`/`AMOUNT_MAX` and
`NAME_MIN_LENGTH`/`SUBJECT_MIN_LENGTH`/`MESSAGE_MIN_LENGTH` come out of the schema modules, and the
`validation` keys take them through ICU (`{min}`, `{max, number}`), so the rule and the message it explains
move together and ICU groups the digits per locale.
[`JsonLd.tsx`](../../ui/modules/shared/seo/JsonLd.tsx)'s `MINIMUM_DONATION` reads `AMOUNT_MIN` because the
structured data advertises a `minPrice`. [`Pricing.tsx`](../../ui/modules/pages/homepage/sections/Pricing.tsx)
quotes the same floor, and [`DonationForm.tsx`](../../ui/modules/shared/donate/DonationForm.tsx) bounds its amount
field with both amounts. [`ContactModal.tsx`](../../ui/modules/shared/contact/ContactModal.tsx) hands the three
minimum lengths to the `contact.errors` keys (`{min, number}`) through `resolveApiErrorMessage`'s `values`.
The maximum lengths are not exported, and no copy states them.

## Testing

Every `dto.ts`, `schema.ts`, `rules.ts` and `utils/*.ts` has a co-located `.test.ts`; the type-only folders have none. Tests call `create` with a literal `raw` object and assert on the output: there is nothing to mock.

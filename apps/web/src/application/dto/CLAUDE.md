# apps/web/src/application/dto

## Purpose

The translation seam between external shapes and the vocabulary in [`CONTEXT.md`](../../../../../CONTEXT.md). A holiday arrives from `date-holidays` as a `RawHoliday`, a payment arrives from Stripe as a `PaymentIntent`, a country list arrives from `i18n-iso-countries` as a map of code to name. Nothing downstream should have to know any of that. A DTO takes the foreign shape in and hands back the canonical one — `HolidayDTO`, `PaymentData`, `CountryDTO` — so stores, use-cases, the domain and the UI only ever speak the glossary.

The rest of the application layer contract is in [`../CLAUDE.md`](../CLAUDE.md).

## One folder per concept

Each concept gets its own folder, and the file names inside it are fixed:

| File | Role | Present in |
| --- | --- | --- |
| `types.ts` | The canonical shape, plus the `Raw*` alias for the foreign one it is built from | every folder |
| `dto.ts` | The mapper — the object implementing `BaseDTO` | `country/`, `holiday/`, `payment/`, `region/` |
| `schema.ts` | A Zod schema for a shape the *user* submits, and the `z.infer` type derived from it | `contact/`, `payment/` |
| `utils/` | Helpers the mapper needs and nobody else should reach for | `country/`, `payment/`, `region/` |

Not every folder needs every file. `email/` and `premium/` are `types.ts` alone: `SendEmailParams` and `PremiumSessionData` are contracts between our own layers, with no foreign shape to normalise and therefore no mapper to write. Do not add an empty `dto.ts` to satisfy the pattern.

| Folder | Canonical shape | Built from |
| --- | --- | --- |
| `contact/` | `ContactData`, `ContactFormData` | the contact form |
| `country/` | `CountryDTO` | `i18n-iso-countries` localised names |
| `email/` | `SendEmailParams` | — |
| `holiday/` | `HolidayDTO` | `date-holidays` |
| `payment/` | `PaymentConfirmationDTO`, `NewPayment` (what `paymentDataDTO` produces) and `PaymentData` (the stored record it grows into), `CreatePaymentInput`, `DiscountInfo` | Stripe `PaymentIntent`, the donation form |
| `premium/` | `PremiumSessionData` | — |
| `region/` | `RegionDTO` | `i18n-iso-countries` localised names |

## Public API

Every mapper implements `BaseDTO` from [`../shared/dto/baseDTO.ts`](../shared/dto/baseDTO.ts):

```typescript
type BaseDTO<INPUT, OUTPUT, PARAMS = undefined> = [PARAMS] extends [undefined]
  ? { create: (args: { raw: INPUT }) => OUTPUT }
  : { create: (args: { raw: INPUT; params: PARAMS }) => OUTPUT };
```

**The shape depends on whether the mapper declared a `PARAMS` type, so the requirement is stated once.**
`holidayDTO` and `paymentDataDTO` need params — there is no sane default for a Planning Window or for the
request metadata attached to a Donation — and omitting them is a compile error. `countryDTO`, `regionDTO` and
`paymentConfirmationDTO` declare none and cannot be handed a spurious one.

That used to be `params?: PARAMS` for every mapper, enforced by two hand-written throws with two different
messages plus a test each — for a condition the compiler had enough information to reject, while the other
three would have accepted an extra argument silently. Both throws and both tests are gone because the case
is unrepresentable. The trade is real and worth naming: the throw also guarded an untyped call path, and
there are none today.

`holidayDTO` widens `BaseDTO` with two extra entry points:

- `createCustom` — builds a Custom Holiday from what the user typed, rather than from upstream data. It
  takes no `locale`: its id is an ISO datetime, built by `isoDateTime` directly rather than through
  `formatDate`, which returned on that format before ever reading a locale.
**`normalize` is gone, and the paragraph that used to sit here said deleting it "would break the planner,
not dead code".** That was true when it was written and had stopped being true. Its stated reasons were that
Manual Days arrive as pseudo-Holidays built in the store and that rehydrated state arrives with dates as
strings. Neither holds: `runPlanningPipeline` builds the `manual-N` pseudo-Holidays now, and
`onRehydrateStorage` revives `state.holidays` through `fromStoredInstant` before anything can read them.

There are exactly four producers of a `HolidayDTO` — `create`, `createCustom`, the worker's
`deserializeHolidays`, and the rehydration revive — and all four hand back a real `Date`. So `normalize` was
the identity function, and its one caller ran it over an array that was already uniform.

**Nothing could have told you that from the tests**, which is the part worth remembering. Its own four cases
included one asserting the coercion, written as `date: '2024-06-15' as unknown as Date` — a cast whose only
purpose is to defeat the type the code does not believe. And `holidays.test.ts` mocked `normalize` to the
identity function, so the store test could not distinguish "essential" from "no-op" either. Both are gone
with it.

The invariant that replaces it is pinned where it is actually established: `holidays.test.ts` round-trips a
persisted Holiday through real `JSON.parse(JSON.stringify(...))` and asserts `state.holidays[0].date` comes
back `instanceof Date`. That is a boundary test over the real serialiser rather than a coercion applied on
the way past. If a producer is ever added that hands back a string, the fix is to type the persisted shape,
not to reinstate a runtime sweep.

`Raw*` types must not escape this folder. If a `RawHoliday` shows up in a store or a component, a mapping step was skipped.

## A DTO does no I/O

Nothing here fetches, writes, logs or reads a clock it was not handed. `create` is a pure function of `raw` and `params`. `stripe`, `date-holidays` and `i18n-iso-countries` appear only as `import type` — no SDK is constructed, so nothing in this folder pulls a runtime dependency in behind it.

That is what lets `HolidayDTO` cross into the domain. The pure calendar context imports `@application/dto/holiday/types` directly, which is a layering inversion on paper: the type describes a Holiday, so it belongs in the domain. It is a known pragmatic exception — moving it means touching every calendar module and its tests — and it is safe only because the file is types and one const object, evaluable inside a Web Worker with no DOM. See [ADR 0003](../../../../../adr/0003-pure-calendar-domain-effectful-payment-domain.md) and [`../../domain/calendar/CLAUDE.md`](../../domain/calendar/CLAUDE.md). If anything with a runtime dependency is ever added to `holiday/types.ts`, the planner breaks in the worker and no server-side test will catch it.

`RegionDTO` also crosses outwards, but downwards only: `holidayDTO.create` takes the region list so `getRegionName` can turn a region code into a display label. No domain code imports it.

## Gotchas

**The two payment mappers disagree about the unit of `amount`, deliberately.** `paymentConfirmationDTO` divides by 100 because it feeds a screen; `paymentDataDTO` keeps Stripe's minor units because it feeds the payments table. Both are built from the same `PaymentIntent`. Check which one you are holding before formatting or summing.

**`holidayDTO.create` sorts twice, and the first sort is not chronological.** It compares nothing but the `location` flag, so Regional entries land after National ones and the `processedDates` dedupe keeps the National Holiday when both fall on the same date. Because that comparator is a real ordering, the sort stays stable: two entries of the same variant on the same date survive in the order upstream listed them, whatever the length of the list. The chronological sort happens at the end of the reduce.

**`isInSelectedRange` is a snapshot of the Planning Window, so whoever carries a Holiday across a window
change has to recompute it.** `isInPlanningWindow` is exported beside the mapper for exactly that: `create`
and `createCustom` both call it, and so does the holidays store, which preserves Custom Holidays verbatim
through a `fetchHolidays` and would otherwise keep the flag from the year they were created in. Only a
flagged Holiday can anchor a Bridge, so a stale `true` lets a Custom Holiday from another year anchor one,
and a stale `false` hides a Custom Holiday the window has since moved back onto.

**It is also the only definition of those bounds, which took a second pass.** The holidays store imported
`isInPlanningWindow` on its first line and then declared a private `getPlanningWindow` that recomputed the
identical interval by hand for `pruneDaysOutsideWindow`. The two spellings differed twice: the store used a
bare `new Date(year, 0, 1)` where this one uses `startOfYear` (a no-op on 1 January), and it wrapped the end
in an extra `endOfMonth`.

That `endOfMonth` is the interesting half. `addMonths` on 31 December already lands on the last day of the
target month — Temporal constrains the day when the month is shorter — so the wrapper could never change the
answer. Which means the two agreed only because of the polyfill's overflow behaviour, and the extra call is
evidence that whoever wrote it was not sure of that. Checked across four years and seven carry-over counts
before deleting it: the two ends are identical at every boundary.

`holidays.test.ts` now pins the last day of the last carry-over month, which is the date the two definitions
could have disagreed on and nothing covered.

**Two date windows, not one.** `create` drops anything outside the chosen year plus the whole of the following year, then sets `isInSelectedRange` from the narrower Planning Window (the year plus its Carry-over Months). Holidays between the two are kept so the UI can show them for context; only those flagged `isInSelectedRange` can anchor a Bridge.

**Schemas carry message keys, not messages.** `contactSchema` and `createPaymentSchema` are pre-bound with keys such as `invalid_email` for server-side validation. The UI calls `createContactSchema` / `createPaymentSchemaWithMessages` with translated strings instead. Adding a validation rule means adding it to the messages interface too, or the localised form silently loses the message.

**The bounds are exported, and the bundles interpolate them.** `AMOUNT_MIN`/`AMOUNT_MAX` and
`NAME_MIN_LENGTH`/`SUBJECT_MIN_LENGTH`/`MESSAGE_MIN_LENGTH` come out of the schema modules, so the rule and
the message it explains move together. They did not: `payment/schema.ts` said `.max(10000)` while twelve
hand-written strings said "Maximum amount is 10,000" — one per bound per locale, each with its own grouping
separator (`10.000`, `10 000`, `10,000`). Raising the cap made every bundle lie. The keys are
`{max, number}` now, so ICU does the grouping per locale and the number comes from the schema.
`JsonLd.tsx`'s `MINIMUM_DONATION` reads `AMOUNT_MIN` for the same reason — the structured data advertises a
`minPrice`, and the app guide used to say the two "move together" as an instruction to the reader.

**`calculateFinalAmount` in `payment/utils/helpers.ts` is not the one in the promo-code service.** This one just unwraps an already-computed `DiscountInfo` for display; the identically named private function in `@infrastructure/services/payments/provider/promoCode` is what actually applies a Stripe coupon.

## Testing

Every `dto.ts`, `schema.ts` and `utils/*.ts` has a co-located `.test.ts`; the type-only folders have none, and should not grow one. Tests call `create` with a literal `raw` object and assert on the output — no mocks, because there is nothing to mock. When a mapper is exercised from a use-case or a service, that test mocks the DTO module wholesale rather than reasoning about the mapping twice.

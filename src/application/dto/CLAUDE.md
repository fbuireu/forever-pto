# src/application/dto

## Purpose

The translation seam between external shapes and the vocabulary in [`CONTEXT.md`](../../../CONTEXT.md). A holiday arrives from `date-holidays` as a `RawHoliday`, a payment arrives from Stripe as a `PaymentIntent`, a country list arrives from `i18n-iso-countries` as a map of code to name. Nothing downstream should have to know any of that. A DTO takes the foreign shape in and hands back the canonical one — `HolidayDTO`, `PaymentData`, `CountryDTO` — so stores, use-cases, the domain and the UI only ever speak the glossary.

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
| `payment/` | `PaymentConfirmationDTO`, `PaymentData`, `CreatePaymentInput`, `DiscountInfo` | Stripe `PaymentIntent`, the donation form |
| `premium/` | `PremiumSessionData` | — |
| `region/` | `RegionDTO` | `i18n-iso-countries` localised names |

## Public API

Every mapper implements `BaseDTO` from [`../shared/dto/baseDTO.ts`](../shared/dto/baseDTO.ts):

```typescript
type BaseDTO<INPUT, OUTPUT, PARAMS = unknown> = {
  create: (params: { raw: INPUT; params?: PARAMS }) => OUTPUT;
};
```

`PARAMS` is optional in the type but not always optional at runtime. `holidayDTO.create` and `paymentDataDTO.create` throw when it is missing, because there is no sane default for a Planning Window or for the request metadata attached to a Donation. That throw is the contract — callers pass params or they get an exception, never a half-built object.

`holidayDTO` widens `BaseDTO` with two extra entry points:

- `createCustom` — builds a Custom Holiday from what the user typed, rather than from upstream data.
- `normalize` — coerces `date` back into a `Date`, passing every other field through untouched. Its one caller is the holidays store's `generateSuggestions`, which runs it over the merged Holiday list immediately before handing it to the engine: Manual Days arrive as pseudo-Holidays built in the store and rehydrated state arrives with dates as strings, so the array reaching the planner is otherwise not uniformly typed. It is **not** part of rehydration — `onRehydrateStorage` revives its own dates through `fromStoredInstant` and never touches this DTO. Deleting `normalize` after checking the rehydration path would break the planner, not dead code.

`Raw*` types must not escape this folder. If a `RawHoliday` shows up in a store or a component, a mapping step was skipped.

## A DTO does no I/O

Nothing here fetches, writes, logs or reads a clock it was not handed. `create` is a pure function of `raw` and `params`. `stripe`, `date-holidays` and `i18n-iso-countries` appear only as `import type` — no SDK is constructed, so nothing in this folder pulls a runtime dependency in behind it.

That is what lets `HolidayDTO` cross into the domain. The pure calendar context imports `@application/dto/holiday/types` directly, which is a layering inversion on paper: the type describes a Holiday, so it belongs in the domain. It is a known pragmatic exception — moving it means touching every calendar module and its tests — and it is safe only because the file is types and one const object, evaluable inside a Web Worker with no DOM. See [ADR 0003](../../../docs/adr/0003-pure-calendar-domain-effectful-payment-domain.md) and [`../../domain/calendar/CLAUDE.md`](../../domain/calendar/CLAUDE.md). If anything with a runtime dependency is ever added to `holiday/types.ts`, the planner breaks in the worker and no server-side test will catch it.

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

**Two date windows, not one.** `create` drops anything outside the chosen year plus the whole of the following year, then sets `isInSelectedRange` from the narrower Planning Window (the year plus its Carry-over Months). Holidays between the two are kept so the UI can show them for context; only those flagged `isInSelectedRange` can anchor a Bridge.

**Schemas carry message keys, not messages.** `contactSchema` and `createPaymentSchema` are pre-bound with keys such as `invalid_email` for server-side validation. The UI calls `createContactSchema` / `createPaymentSchemaWithMessages` with translated strings instead. Adding a validation rule means adding it to the messages interface too, or the localised form silently loses the message.

**`calculateFinalAmount` in `payment/utils/helpers.ts` is not the one in the promo-code service.** This one just unwraps an already-computed `DiscountInfo` for display; the identically named private function in `@infrastructure/services/payments/provider/promoCode` is what actually applies a Stripe coupon.

## Testing

Every `dto.ts`, `schema.ts` and `utils/*.ts` has a co-located `.test.ts`; the type-only folders have none, and should not grow one. Tests call `create` with a literal `raw` object and assert on the output — no mocks, because there is nothing to mock. When a mapper is exercised from a use-case or a service, that test mocks the DTO module wholesale rather than reasoning about the mapping twice.

# holidays

## Purpose

Fetches and normalizes national and regional holidays using the `date-holidays` library. Transforms raw data into `HolidayDTO` models ready for consumption by stores and UI.

## Domain concepts

- **RawHoliday**: native `date-holidays` format — discarded after transformation.
- **HolidayDTO**: canonical model with `id`, `name`, `date`, `variant`, `location`, and `isInSelectedRange`.
- **HolidayVariant**: `NATIONAL` | `REGIONAL` | `CUSTOM` — determines how a holiday is displayed and managed.
- **Location**: field added only to regional holidays to identify their geographic origin.

## Key functions

- `getHolidays()` — orchestrator: combines national + regional, transforms via DTO, returns sorted list.
- `getNationalHolidays()` — fetches country holidays for the current and next year.
- `getRegionalHolidays()` — fetches region-specific holidays, appending the `location` field.

## Non-obvious patterns

- Both the current and next year's holidays are loaded in a single call to avoid re-fetches on year changes.
- Errors return an empty array — they do not block the user flow.
- Error logging goes to BetterStack, not `console`.

## Dependencies

- `date-holidays` (npm) — data source
- `@application/dto/holiday` — transformation to domain model
- `@infrastructure/clients/logging/better-stack` — error logging

## Out of scope

Custom holidays (managed in the `holidays` store), suggestion logic, persistence.

# src/infrastructure/services/holidays

## Purpose

Turns the `date-holidays` package into the Holidays of one Country, one optional Region and one Planning
Window. It is the whole holiday data path: what comes out of here is what the planner treats as Free Days.

Custom Holidays are not built here — the holidays store calls `holidayDTO.createCustom` for those — and
nothing in this folder decides which Holidays anchor a Bridge. It fetches, discards the classifications that
are not non-working days, tags and hands over.

## Files

| File | Role |
| --- | --- |
| `getHolidays.ts` | The only export anything outside this folder uses: combines national and regional raw holidays, hands them to `holidayDTO` and returns what it gets back |
| `utils/holidays.ts` | `getHolidaysForYears`, `getNationalHolidays`, `getRegionalHolidays` — thin wrappers over the `Holidays` constructor, plus the `type` filter. The only `date-holidays` calls in the app besides `getRegions.ts` |

## Public API

`getHolidays({ year, country, carryOverMonths, region, locale, regions })` → `Promise<HolidayDTO[]>`.

- **No `country` → `[]`, immediately.** That is the normal first call, not an error: the planner renders
  before a Country has been detected or chosen.
- `locale` is passed on as `{ languages: [locale] }`, so the package returns translated Holiday names.
- `regions` is the `RegionDTO[]` list from the location store. It is forwarded to the DTO purely so a
  region code can be rendered as a label; it plays no part in the lookup.
- `region` must be a key from `getRegions.ts` (`getStates()` output), because that is what
  `new Holidays(country, region)` expects. An unusable code never surfaces as an exception — see the
  error contract below.

## This runs in the browser

The one caller is `fetchHolidays` in `src/application/stores/holidays.ts`, and it reaches this module
through a dynamic `import()`. Holiday data ships in the client bundle and is computed on the device
([ADR 0001](../../../../docs/adr/0001-planner-runs-in-the-browser.md)). Two consequences are easy to miss:

- **No Node and no Cloudflare APIs may appear here or in anything it imports.** Logging goes through the
  `getBetterStackInstance()` singleton rather than `LoggerService`, because there is no Effect layer on
  the browser path — the logging exception in
  [ADR 0002](../../../../docs/adr/0002-effect-for-external-service-boundaries.md).
- **The work is synchronous and it is not offloaded to the Web Worker.** `Effect.try` wraps a plain
  computation; only suggestion generation goes through `src/infrastructure/workers/worker.ts`. Building
  two years of Holidays blocks the main thread, and it re-runs on every Country, Region, year or
  Carry-over Months change.

## Invariants

**Two years are always fetched, and 12 is the number that makes that safe.** `getHolidaysForYears` asks
for `year` and `year + 1` regardless of `carryOverMonths`; `holidayDTO.create` then drops anything past the
end of `year + 1` and flags only the Planning Window as `isInSelectedRange`. The Carry-over Months slider
is capped at 12 in `CarryOverMonths.tsx`, so the widest possible window ends exactly at the last day
fetched. Raise that cap and the extra months arrive empty, with no error anywhere.

**Only `public` and `bank` entries survive.** `date-holidays` classifies every entry it emits with a `type` —
`public`, `bank`, `school`, `optional` or `observance` — and `getHolidaysForYears` keeps the first two and
drops the rest. Those two are the days offices are closed and nobody is expected to work, which is what a
Holiday means here. `school` closes schools only; `optional` ("majority of people take a day off") and
`observance` ("optional festivity, no paid day off") still cost the user a PTO Day, so admitting them would
let an ordinary Workday count as a Free Day, inflate Effective Days and anchor a Bridge. Anyone who does get
those days off can add them back as Custom Holidays. Widening the accepted set changes every plan, so change
it deliberately or not at all.

**`type` is upstream's classification and is never the Holiday Variant.** The two are separate fields on
`HolidayDTO`; `variant` is National, Regional or Custom and is derived from `location`. The glossary reserves
the word "type" for the upstream sense — see [`CONTEXT.md`](../../../../CONTEXT.md).

**`location` is the only signal of Variant.** `getRegionalHolidays` stamps `location: region` onto every
entry it returns and national lookups leave it absent. Downstream, that single field decides REGIONAL vs
NATIONAL and drives the dedupe that keeps the National Holiday when both fall on the same date. Dropping
it, or setting it on national entries, silently rewrites the calendar.

**Failure means an empty calendar, never a throw.** `Effect.try` plus `catchAll` logs `Error in getHolidays`
to BetterStack with `{ country, region, year }` and returns `[]`. A country the package has no data for,
a rejected region code, a DTO that throws — all degrade to a Country with no Holidays. The store wraps the
call in a second `try`/`catch` for the same reason, and keeps existing Custom Holidays when it fires.

## Gotchas

**`type` is filtered here and nowhere else.** Past this folder the string is carried through to
`HolidayDTO.type` untouched and only ever displayed, by `HolidaysTable.tsx` and `HolidayRow.tsx`. Neither the
DTO nor the domain reads it, so the accepted set above is the single place that decides what counts as a
non-working day — a second filter downstream would be invisible.

**`holidayDTO.create` owns the ordering.** It ends in a `toSorted` by date, and `getHolidays` returns that
array as it comes. There is exactly one sort in the path; do not add another here on the assumption that the
DTO's is incidental.

**Regional entries are appended after national ones on purpose.** `getHolidays` builds
`[...nationalHolidays, ...regionalHolidays]`, and the DTO's first sort relies on regional entries being
distinguishable so the dedupe resolves in favour of the national one. The ordering of that array is part
of the contract with `src/application/dto/holiday/dto.ts`, not an implementation detail.

## Testing

Both files have a co-located test. `getHolidays.test.ts` mocks `./utils/holidays` and the DTO, so it
asserts wiring — which params reach the package, that both lists are concatenated, that the error path
logs and returns `[]`. `utils/holidays.test.ts` mocks the `date-holidays` default export.

No test constructs the real package. Holiday data itself is upstream's, and pinning assertions to it would
break on every dependency bump — the version bundled is the version shipped
([ADR 0001](../../../../docs/adr/0001-planner-runs-in-the-browser.md)).

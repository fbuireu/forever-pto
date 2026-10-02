# apps/web/src/infrastructure/services/holidays

## Purpose

Turns the `date-holidays` package into the Holidays of one Country, one optional Region and one Planning
Window. It is the whole Holiday data path: what comes out of here is what the planner treats as Free Days.

Custom Holidays are not built here (the holidays store calls `holidayDTO.createCustom` for those), and
nothing in this folder decides which Holidays anchor a Bridge. It fetches, discards the classifications that
are not non-working days, tags and hands over.

## Files

| File | Role |
| --- | --- |
| [`getHolidays.ts`](./getHolidays.ts) | Asks the Holiday source what is observed (through `cachedObservedHolidays`), derives the Region list from the same source, and maps both through `holidayDTO` |
| [`source/types.ts`](./source/types.ts) | `HolidaySource`, the seam: `rawHolidays(lookup)` and `regionsOf(country)`, and nothing else |
| [`source/dateHolidays.ts`](./source/dateHolidays.ts) | The production adapter. The **only** place in the app that constructs `Holidays` |
| [`source/fixture.ts`](./source/fixture.ts) | `createFixtureHolidaySource(calendar)`: the test adapter, plain data in |
| [`source/observedHolidays.ts`](./source/observedHolidays.ts) | `observedHolidays({ source, lookup })`: the rules, composed **above** the seam so both adapters go through them |
| [`source/cachedObservedHolidays.ts`](./source/cachedObservedHolidays.ts) | `cachedObservedHolidays`: the last lookup, kept in one slot keyed on Country, Region, year, locale and the source, so a Carry-over Months change re-runs only the mapping |
| [`source/utils/observed.ts`](./source/utils/observed.ts) | `resolveObservedHolidays`: the Region-over-Country rule, pure |
| [`source/utils/nonWorking.ts`](./source/utils/nonWorking.ts) | `keepNonWorking` (the `public`/`bank` filter) and `stampRegion` (the `location` stamp), pure |

## The seam is the source, not the mapper

The DTO translates *shape*; it never decides what a Holiday is. The rules (what counts as a non-working day,
the Region that removes a National day, the stamp that tells the two apart) sit in `observedHolidays`, which
composes them **above** the seam, and there is an adapter on each side below it, which is what makes it a real
seam rather than a hypothetical one:

- `dateHolidaysSource` in production. It owns the `Holidays` constructor and the two-year fetch and
  **nothing else**: it returns the raw lookups and lets the rules run over them.
- `createFixtureHolidaySource` in tests. `getHolidays.test.ts` uses it to run the **real** DTO over
  fixture data, so the whole path is asserted end to end, rules included.

`getRegions.ts` under `services/regions/` calls `regionsOf` on the same adapter rather than constructing its
own `Holidays`. It stays in its own folder because a Region list is a location concern.

## Public API

`getHolidays({ year, country, carryOverMonths, region, locale, source? })` → `Promise<HolidayDTO[]>`.

- **No `country` → `[]`, immediately.** That is the normal first call, not an error: the planner renders
  before a Country has been detected or chosen.
- **The Region *list* is derived here, from the same `source`, and is not a parameter.** The DTO needs it
  only to render a region code as a label. `getRegions` is a pure synchronous function of the Country over this
  same adapter; read from the location store instead, the label would stay the raw code (`CA` instead of
  `California`) whenever this ran first.
- `region` must be a key from `getRegions.ts` (`getStates()` output), because that is what
  `new Holidays(country, region)` expects. An unusable code never surfaces as an exception; see the
  error contract below.

## This runs in the browser

The one caller is `fetchHolidays` in [`src/application/stores/holidays.ts`](../../../application/stores/holidays.ts), and it reaches this module
through a dynamic `import()`. Holiday data ships in the client bundle and is computed on the device
([ADR 0001](../../../../../../adr/0001-planner-runs-in-the-browser.md)). Consequences that are easy to miss:

- **No Node and no Cloudflare APIs may appear here or in anything it imports.** Logging goes through the
  `logger` import rather than `LoggerService`, because there is no Effect layer on
  the browser path, the logging exception in
  [ADR 0002](../../../../../../adr/0002-effect-for-external-service-boundaries.md).
- **The work is synchronous and it is not offloaded to the Web Worker.** `Effect.try` wraps a plain
  computation; only suggestion generation goes through [`src/infrastructure/workers/worker.ts`](../../workers/worker.ts). Building
  two years of Holidays blocks the main thread, and it re-runs on every Country, Region, year or locale change;
  a Carry-over Months change re-runs only the mapping, over the lookup `cachedObservedHolidays` kept.

## Invariants

**Two years are always fetched, and `MAX_CARRY_OVER_MONTHS` is the number that makes that safe.** The adapter
asks for `year` and `year + 1` regardless of `carryOverMonths`; `holidayDTO.create` then drops anything past
the end of the widest window that bound allows, and flags only the actual Planning Window as
`isInPlanningWindow`. That bound lives in
[`../../../domain/calendar/window.ts`](../../../domain/calendar/window.ts), and both the slider's clamp
and the mapper's keep window derive from it, so the widest possible window ends exactly at the last day
fetched; [`window.test.ts`](../../../domain/calendar/window.test.ts) pins that it still ends inside `year + 1`.
**`forYears` here is the third statement of the same fact, as a literal**, so raising
`MAX_CARRY_OVER_MONTHS` past 12 means widening this adapter too; otherwise the extra months arrive empty, with
no error anywhere and every Bridge there scored against a blank calendar.

**Only `public` and `bank` entries survive.** `date-holidays` classifies every entry it emits with a `type`
(`public`, `bank`, `school`, `optional` or `observance`), and `keepNonWorking`, composed in `observedHolidays`,
keeps `public` and `bank` and drops the rest. Those are the days offices are closed and nobody is expected to
work, which is what a Holiday means here. `school` closes schools only; `optional` ("majority of people take a
day off") and `observance` ("optional festivity, no paid day off") still cost the user a PTO Day, so admitting
them would let an ordinary Workday count as a Free Day, inflate Effective Days and anchor a Bridge. Anyone who
does not work those days can add them back as Custom Holidays. Widening the accepted set changes every plan, so
change it deliberately or not at all.

**`location` is the only signal of Variant.** The source looks the Country up twice (once bare, once with the
Region), and `observedHolidays` stamps `location: region` onto the regional entries only, through
`stampRegion`; the national lookup leaves it absent. Downstream, that single field decides REGIONAL vs
NATIONAL and drives the dedupe that keeps the National Holiday when both fall on the same date. Dropping
it, or setting it on national entries, silently rewrites the calendar.

**A Region can *remove* a National Holiday, and the national list is filtered against it.**
`new Holidays(country, region)` returns that region's **complete** calendar, country rules included, minus
whatever the region does not observe, so concatenating the country-level lookup would put back every national
day the region drops (Columbus Day for California) as a Free Day. `resolveObservedHolidays` keeps a national
entry only when the regional lookup emitted the same date.

The national lookup cannot simply be dropped in its place, and that is why this is a filter: it is the only
source of entries *without* `location`, so removing it would label New Year's Day itself REGIONAL. The
`hasRegion` flag is load-bearing for the same reason: with no Region the regional lookup returns `[]`, and
an unconditional filter would empty the calendar. [`source/utils/observed.test.ts`](./source/utils/observed.test.ts)
asserts the rule on plain arrays.

**Failure means an empty calendar, never a throw.** `Effect.try` plus `catchAll` logs `Error in getHolidays`
through `logger.logError` with `{ country, region, year }` and returns `[]`. A country the package has no data
for, a rejected region code, a DTO that throws: all degrade to a Country with no Holidays. The store wraps the
call in a second `try`/`catch` for the same reason, and keeps existing Custom Holidays when it fires.

## Gotchas

**`type` is filtered by `keepNonWorking` and nowhere else.** Past this folder the string is carried through to
`HolidayDTO.type` untouched and only ever displayed and searched, by [`HolidaysTable.tsx`](../../../ui/modules/pages/planner/holidays/HolidaysTable.tsx) and [`HolidayRow.tsx`](../../../ui/modules/pages/planner/holidays/components/HolidayRow.tsx). Neither the
DTO nor the domain reads it, so the accepted set above is the single place that decides what counts as a
non-working day; a second filter downstream would be invisible.

**`holidayDTO.create` owns the ordering.** It ends in a `toSorted` by date, and `getHolidays` returns that
array as it comes.

**The DTO tells the National entry from the Regional one by `location`, not by position.** Its first sort puts
entries without `location` ahead of the stamped ones, so its dedupe keeps the National entry whatever order
`resolveObservedHolidays` returns them in. What the contract with
[`src/application/dto/holiday/dto.ts`](../../../application/dto/holiday/dto.ts) needs from this folder is the
stamp on the regional entries and on nothing else.

**Both lookups agree on the raw date string, which is what makes the filter above safe.** The DTO dedupes
on `holiday.date` verbatim rather than on the calendar day, and both lookups emit the same
`YYYY-MM-DD HH:mm:ss` for a shared Holiday, checked across a full year of US/CA. A future upstream that
formatted them differently would defeat both the dedupe and the filter at once, and neither would report
anything.

## Testing

`getHolidays.test.ts` runs the **real** DTO over `createFixtureHolidaySource`. The fixture's regional entries
carry no `location` of their own and one national entry is an `observance`, so the stamp and the filter are
proved rather than performed by the fixture. [`dateHolidays.test.ts`](./source/dateHolidays.test.ts) asserts how
the package is asked, never what it returns, since the version bundled is the version shipped
([ADR 0001](../../../../../../adr/0001-planner-runs-in-the-browser.md)).

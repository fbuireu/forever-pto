# apps/web/src/infrastructure/services/holidays

## Purpose

Turns the `date-holidays` package into the Holidays of one Country, one optional Region and one Planning
Window. It is the whole holiday data path: what comes out of here is what the planner treats as Free Days.

Custom Holidays are not built here, since the holidays store calls `holidayDTO.createCustom` for those, and
nothing in this folder decides which Holidays anchor a Bridge. It fetches, discards the classifications that
are not non-working days, tags and hands over.

## Files

| File | Role |
| --- | --- |
| [`getHolidays.ts`](./getHolidays.ts) | Asks the Holiday source what is observed and maps it through `holidayDTO`. That is all it does |
| [`source/types.ts`](./source/types.ts) | `HolidaySource` — the seam: `rawHolidays(lookup)` and `regionsOf(country)`, and nothing else |
| [`source/dateHolidays.ts`](./source/dateHolidays.ts) | The production adapter. The **only** place in the app that constructs `Holidays` |
| [`source/fixture.ts`](./source/fixture.ts) | `createFixtureHolidaySource(calendar)` — the test adapter, plain data in |
| [`source/observedHolidays.ts`](./source/observedHolidays.ts) | `observedHolidays(source, lookup)` — the three rules, composed **above** the seam so both adapters go through them |
| [`source/utils/observed.ts`](./source/utils/observed.ts) | `resolveObservedHolidays` — the Region-over-Country rule, pure |
| [`source/utils/nonWorking.ts`](./source/utils/nonWorking.ts) | `keepNonWorking` (the `public`/`bank` filter) and `stampRegion` (the `location` stamp), pure |

## The seam is the source, not the mapper

The DTO translates *shape*; it never decided what a Holiday is. Three rules did, and they used to sit in
three different places: what counts as a non-working day lived in a wrapper over the package, the
Region-removes-a-National-day correction lived in `getHolidays.ts`, and the ordering the mapper's dedupe
depends on was an undocumented property of how `getHolidays` concatenated two arrays. Swapping the upstream
package meant editing all three plus a fourth call site in [`getRegions.ts`](../regions/getRegions.ts).

They now sit in `observedHolidays`, which composes them **above** the seam, and there are two adapters below
it, which is what makes it a real seam rather than a hypothetical one:

- `dateHolidaysSource` in production. It owns the `Holidays` constructor and the two-year fetch and
  **nothing else**: it returns the two raw lookups and lets the rules run over them.

**The seam used to sit one level higher, and two of the three rules were stranded above the fixture.**
`HolidaySource.observedHolidays` promised "already filtered, already stamped", so `keepNonWorking` and
`stampRegion` ran inside `dateHolidaysSource` only. The consequence was visible in the very test this guide
holds up as the end-to-end one: [`getHolidays.test.ts`](./getHolidays.test.ts) hand-wrote `location: 'CA'` on its regional fixtures —
exactly what `stampRegion` would have set — and every entry was `type: 'public'` because nothing on that path
filtered. Deleting `keepNonWorking` from the adapter left that suite green. Both rules are now reachable
from it, and the fixtures stop performing them as ritual: an `observance` entry proves the filter and the
regional entries carry no `location` of their own.
- `createFixtureHolidaySource` in tests. `getHolidays.test.ts` uses it to run the **real** DTO over
  fixture data, so the whole path is asserted end to end. It used to mock the package wrapper *and* the DTO,
  which meant the folder's load-bearing invariant had no test that could fail for the right reason.

`getRegions.ts` under `services/regions/` calls `regionsOf` on the same adapter rather than constructing its
own `Holidays`. It stays in its own folder because a Region list is a location concern, but it no longer has
its own dependency on the package.

## Public API

`getHolidays({ year, country, carryOverMonths, region, locale, source? })` → `Promise<HolidayDTO[]>`.
`source` defaults to `dateHolidaysSource`; nothing in production passes it.

- **No `country` → `[]`, immediately.** That is the normal first call, not an error: the planner renders
  before a Country has been detected or chosen.
- `locale` is passed on as `{ languages: [locale] }`, so the package returns translated Holiday names.
- **The Region *list* is derived here, from the same `source`, and is not a parameter.** The DTO needs it
  only to render a region code as a label; it plays no part in the lookup. It used to arrive as a `regions`
  argument that `fetchHolidays` read out of the location store — a store populated by [`Regions.tsx`](../../../ui/modules/sidebar/components/Regions.tsx)'s effect,
  a different `dynamic()` component. Nothing ordered the two, and `regions` sits in no dependency array, so
  whenever this ran first the label stayed the raw code, `CA` instead of `California`, for the rest of the
  session. `getRegions` is a pure synchronous function of the Country over this same adapter, so deriving it
  removes the ordering question rather than answering it. Do not reintroduce the parameter.
- `region` must be a key from `getRegions.ts` (`getStates()` output), because that is what
  `new Holidays(country, region)` expects. An unusable code never surfaces as an exception; see the
  error contract below.

## This runs in the browser

The one caller is `fetchHolidays` in [`src/application/stores/holidays.ts`](../../../application/stores/holidays.ts), and it reaches this module
through a dynamic `import()`. Holiday data ships in the client bundle and is computed on the device
([ADR 0001](../../../../../../adr/0001-planner-runs-in-the-browser.md)). Two consequences are easy to miss:

- **No Node and no Cloudflare APIs may appear here or in anything it imports.** Logging goes through the
  `getBetterStackInstance()` singleton rather than `LoggerService`, because there is no Effect layer on
  the browser path. That is the logging exception in
  [ADR 0002](../../../../../../adr/0002-effect-for-external-service-boundaries.md).
- **The work is synchronous and it is not offloaded to the Web Worker.** `Effect.try` wraps a plain
  computation; only suggestion generation goes through [`src/infrastructure/workers/worker.ts`](../../workers/worker.ts). Building
  two years of Holidays blocks the main thread, and it re-runs on every Country, Region, year or
  Carry-over Months change.

## Invariants

**Two years are always fetched, and 12 is the number that makes that safe.** The adapter asks
for `year` and `year + 1` regardless of `carryOverMonths`; `holidayDTO.create` then drops anything past the
end of `year + 1` and flags only the Planning Window as `isInSelectedRange`. The Carry-over Months slider
is capped at 12 in [`CarryOverMonths.tsx`](../../../ui/modules/sidebar/components/CarryOverMonths.tsx), so the widest possible window ends exactly at the last day
fetched. Raise that cap and the extra months arrive empty, with no error anywhere.

**Only `public` and `bank` entries survive.** `date-holidays` classifies every entry it emits with a `type`
(`public`, `bank`, `school`, `optional` or `observance`) and the adapter keeps the first two and
drops the rest. Those two are the days offices are closed and nobody is expected to work, which is what a
Holiday means here. `school` closes schools only; `optional` ("majority of people take a day off") and
`observance` ("optional festivity, no paid day off") still cost the user a PTO Day, so admitting them would
let an ordinary Workday count as a Free Day, inflate Effective Days and anchor a Bridge. Anyone who does get
those days off can add them back as Custom Holidays. Widening the accepted set changes every plan, so change
it deliberately or not at all.

**`type` is upstream's classification and is never the Holiday Variant.** The two are separate fields on
`HolidayDTO`; `variant` is National, Regional or Custom and is derived from `location`. The glossary reserves
the word "type" for the upstream sense; see [`CONTEXT.md`](../../../../../../CONTEXT.md).

**`location` is the only signal of Variant.** `observedHolidays` looks the country up twice, once bare and once
with the region, and stamps `location: region` onto the regional entries only; the national lookup leaves it
absent. Downstream, that single field decides REGIONAL vs
NATIONAL and drives the dedupe that keeps the National Holiday when both fall on the same date. Dropping
it, or setting it on national entries, silently rewrites the calendar.

**A Region can *remove* a National Holiday, and the national list is filtered against it.**
`new Holidays(country, region)` does not return a region's extras; it returns that region's **complete**
calendar, country rules included, minus whatever the region does not observe. So concatenating the
country-level lookup put back every national day the region had dropped: a Californian's 2027 calendar
carried Columbus Day, a Scot's carried Easter Monday, Luzern's carried Ostermontag and Pfingstmontag. Those
dates then became Free Days, struck from the Workday list so no PTO Day was ever placed on them, and
expanded straight through by `analyzePotentialBridge`, inflating Effective Days, Efficiency and Longest
Vacation. `resolveObservedHolidays` keeps a national entry only when the regional lookup emitted the same
date.

The national lookup cannot simply be dropped in its place, and that is why this is a filter: it is the only
source of entries *without* `location`, so removing it would label New Year's Day itself REGIONAL. The
`hasRegion` flag is load-bearing for the same reason: with no Region the regional lookup returns `[]`, and
an unconditional filter would empty the calendar. That rule is a pure function over plain arrays now, so it
is asserted directly in [`source/utils/observed.test.ts`](./source/utils/observed.test.ts) rather than through a mocked package.

**Failure means an empty calendar, never a throw.** `Effect.try` plus `catchAll` logs `Error in getHolidays`
to BetterStack with `{ country, region, year }` and returns `[]`. A country the package has no data for,
a rejected region code, a DTO that throws: all degrade to a Country with no Holidays. The store wraps the
call in a second `try`/`catch` for the same reason, and keeps existing Custom Holidays when it fires.

## Gotchas

**`type` is filtered in the adapter and nowhere else.** Past this folder the string is carried through to
`HolidayDTO.type` untouched and only ever displayed, by [`HolidaysTable.tsx`](../../../ui/modules/pages/planner/holidays/HolidaysTable.tsx) and [`HolidayRow.tsx`](../../../ui/modules/pages/planner/holidays/components/HolidayRow.tsx). Neither the
DTO nor the domain reads it, so the accepted set above is the single place that decides what counts as a
non-working day, and a second filter downstream would be invisible.

**`holidayDTO.create` owns the ordering.** It ends in a `toSorted` by date, and `getHolidays` returns that
array as it comes. There is exactly one sort in the path; do not add another here on the assumption that the
DTO's is incidental.

**Regional entries are appended after national ones on purpose.** `resolveObservedHolidays` returns
national first, and the DTO's first sort relies on regional entries being distinguishable so the dedupe
resolves in favour of the national one. The ordering is part of the contract with
[`src/application/dto/holiday/dto.ts`](../../../application/dto/holiday/dto.ts), not an implementation detail — which is why it is a rule inside the
source rather than the shape of a concatenation at a call site, and why `observed.test.ts` asserts it.

**The two lookups agree on the raw date string, which is what makes the filter above safe.** The DTO dedupes
on `holiday.date` verbatim rather than on the calendar day, and both lookups emit the same
`YYYY-MM-DD HH:mm:ss` for a shared Holiday, checked across a full year of US/CA. A future upstream that
formatted the two differently would defeat both the dedupe and the filter at once, and neither would report
anything.

## Testing

`getHolidays.test.ts` runs the **real** DTO over `createFixtureHolidaySource`, so it asserts the path a user
gets: a Region drops the National day it does not observe, a shared date resolves to the National entry, a
source that throws yields an empty calendar and a log. It mocks only the logging singleton.
`source/utils/observed.test.ts` pins the Region-over-Country rule on plain arrays.

**`source/dateHolidays.ts` is tested on its call pattern and on nothing else, and the distinction is the
whole point.** Holiday data is upstream's: the version bundled is the version shipped
([ADR 0001](../../../../../../adr/0001-planner-runs-in-the-browser.md)), so an assertion about what
`date-holidays` returns for a given date would break on every dependency bump and would prove only that the
fixture agreed with whoever wrote it. What the adapter decides for itself is *how the package is asked*, and
that a mock can answer honestly: [`dateHolidays.test.ts`](./source/dateHolidays.test.ts) pins that both `year` and `year + 1` are fetched —
the Planning Window reaches into the following year — that a second, Region-scoped `Holidays` is constructed
only when a Region is given, that the locale travels as `languages: [locale]`, and that `regionsOf`
lower-cases the Country and normalises the package's absent answer to `null`.

It carried the `public`/`bank` filter and the `location` stamp until those became `keepNonWorking` and
`stampRegion`, and then carried them again by *calling* them, which is what put them out of the fixture's

reach. They are applied in `observedHolidays` now, above the seam. A new rule goes in `source/utils/` and is
composed there; putting it in the adapter makes it unreachable from every test that uses the fixture.

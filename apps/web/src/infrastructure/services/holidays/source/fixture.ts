import type { RawHoliday } from '@application/dto/holiday/types';
import type { HolidayLookup, HolidaySource } from './types';

interface FixtureCalendar {
  national?: RawHoliday[];
  regional?: Record<string, RawHoliday[]>;
  regions?: Record<string, Record<string, string>>;
}

export function createFixtureHolidaySource(calendar: FixtureCalendar): HolidaySource {
  return {
    rawHolidays: ({ region }: HolidayLookup) => ({
      national: calendar.national ?? [],
      regional: (region ? calendar.regional?.[region] : undefined) ?? [],
    }),

    regionsOf: (country: string) => calendar.regions?.[country] ?? null,
  };
}

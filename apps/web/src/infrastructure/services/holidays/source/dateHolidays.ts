import type { RawHoliday } from '@application/dto/holiday/types';
import Holidays from 'date-holidays';
import type { HolidayLookup, HolidaySource } from './types';

const forYears = (holidays: Holidays, year: number): RawHoliday[] => [
  ...holidays.getHolidays(year),
  ...holidays.getHolidays(year + 1),
];

export const dateHolidaysSource: HolidaySource = {
  rawHolidays: ({ country, region, year, locale }: HolidayLookup) => {
    const configuration = { languages: [locale] };

    return {
      national: forYears(new Holidays(country, configuration), year),
      regional: region ? forYears(new Holidays(country, region, configuration), year) : [],
    };
  },

  regionsOf: (country: string) => new Holidays(country).getStates(country.toLowerCase()) ?? null,
};

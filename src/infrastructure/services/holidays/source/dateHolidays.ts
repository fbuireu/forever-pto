import type { RawHoliday } from '@application/dto/holiday/types';
import Holidays, { type HolidaysTypes } from 'date-holidays';
import type { HolidayLookup, HolidaySource } from './types';
import { resolveObservedHolidays } from './utils/observed';

const NON_WORKING_TYPES = new Set<HolidaysTypes.HolidayType>(['public', 'bank']);

const forYears = (holidays: Holidays, year: number): RawHoliday[] =>
  [...holidays.getHolidays(year), ...holidays.getHolidays(year + 1)].filter(({ type }) => NON_WORKING_TYPES.has(type));

export const dateHolidaysSource: HolidaySource = {
  observedHolidays: ({ country, region, year, locale }: HolidayLookup) => {
    const configuration = { languages: [locale] };
    const national = forYears(new Holidays(country, configuration), year);
    const regional = region
      ? forYears(new Holidays(country, region, configuration), year).map((holiday) => ({
          ...holiday,
          location: region,
        }))
      : [];

    return resolveObservedHolidays({ national, regional, hasRegion: Boolean(region) });
  },

  regionsOf: (country: string) => new Holidays(country).getStates(country.toLowerCase()) ?? null,
};

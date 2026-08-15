import type { RawHoliday } from '@application/dto/holiday/types';
import Holidays from 'date-holidays';
import type { HolidayLookup, HolidaySource } from './types';
import { keepNonWorking, stampRegion } from './utils/nonWorking';
import { resolveObservedHolidays } from './utils/observed';

const forYears = (holidays: Holidays, year: number): RawHoliday[] =>
  keepNonWorking([...holidays.getHolidays(year), ...holidays.getHolidays(year + 1)]);

export const dateHolidaysSource: HolidaySource = {
  observedHolidays: ({ country, region, year, locale }: HolidayLookup) => {
    const configuration = { languages: [locale] };
    const national = forYears(new Holidays(country, configuration), year);
    const regional = region ? stampRegion(forYears(new Holidays(country, region, configuration), year), region) : [];

    return resolveObservedHolidays({ national, regional, hasRegion: Boolean(region) });
  },

  regionsOf: (country: string) => new Holidays(country).getStates(country.toLowerCase()) ?? null,
};

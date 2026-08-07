import { holidayDTO } from '@application/dto/holiday/dto';
import type { HolidayDTO } from '@application/dto/holiday/types';
import type { RegionDTO } from '@application/dto/region/types';
import { getBetterStackInstance } from '@infrastructure/clients/logging/better-stack/client';
import { Effect } from 'effect';
import type { Locale } from 'next-intl';
import { getNationalHolidays, getRegionalHolidays } from './utils/holidays';

const logger = getBetterStackInstance();

interface GetHolidaysParams {
  year: number;
  country?: string;
  carryOverMonths: number;
  region?: string;
  locale: Locale;
  regions: RegionDTO[];
}

export async function getHolidays({ year, country, region, locale, carryOverMonths, regions }: GetHolidaysParams) {
  if (!country) return [];

  const program = Effect.try(() => {
    const configuration = { languages: [locale] };
    const params = { country, configuration, year };
    const nationalHolidays = getNationalHolidays(params);
    const regionalHolidays = getRegionalHolidays({ ...params, region });
    const observedDates = new Set(regionalHolidays.map(({ date }) => date));
    const observedNationalHolidays = region
      ? nationalHolidays.filter(({ date }) => observedDates.has(date))
      : nationalHolidays;

    return holidayDTO.create({
      raw: [...observedNationalHolidays, ...regionalHolidays],
      params: { year, carryOverMonths, regions },
    });
  }).pipe(
    Effect.catchAll((error) => {
      logger.logError('Error in getHolidays', error, { country, region, year });
      return Effect.succeed([] as HolidayDTO[]);
    })
  );

  return Effect.runPromise(program);
}

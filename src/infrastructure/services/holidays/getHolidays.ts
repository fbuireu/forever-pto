import { holidayDTO } from '@application/dto/holiday/dto';
import type { HolidayDTO } from '@application/dto/holiday/types';
import type { RegionDTO } from '@application/dto/region/types';
import { getBetterStackInstance } from '@infrastructure/clients/logging/better-stack/client';
import { Effect } from 'effect';
import type { Locale } from 'next-intl';
import { getNationalHolidays } from './utils/getNationalHolidays';
import { getRegionalHolidays } from './utils/getRegionalHolidays';

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
  if (!country) {
    return [];
  }

  const program = Effect.try(() => {
    const configuration = { languages: [locale] };
    const params = { country, configuration, year };
    const nationalHolidays = getNationalHolidays(params);
    const regionalHolidays = getRegionalHolidays({ ...params, region });

    return holidayDTO
      .create({
        raw: [...nationalHolidays, ...regionalHolidays],
        params: { year, carryOverMonths, regions },
      })
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }).pipe(
    Effect.catchAll((error) => {
      logger.logError('Error in getHolidays', error, { country, region, year });
      return Effect.succeed([] as HolidayDTO[]);
    })
  );

  return Effect.runPromise(program);
}

import { holidayDTO } from '@application/dto/holiday/dto';
import type { HolidayDTO } from '@application/dto/holiday/types';
import type { RegionDTO } from '@application/dto/region/types';
import { getBetterStackInstance } from '@infrastructure/clients/logging/better-stack/client';
import { Effect } from 'effect';
import type { Locale } from 'next-intl';
import { dateHolidaysSource } from './source/dateHolidays';
import type { HolidaySource } from './source/types';

const logger = getBetterStackInstance();

interface GetHolidaysParams {
  year: number;
  country?: string;
  carryOverMonths: number;
  region?: string;
  locale: Locale;
  regions: RegionDTO[];
  source?: HolidaySource;
}

export async function getHolidays({
  year,
  country,
  region,
  locale,
  carryOverMonths,
  regions,
  source = dateHolidaysSource,
}: GetHolidaysParams) {
  if (!country) return [];

  const program = Effect.try(() =>
    holidayDTO.create({
      raw: source.observedHolidays({ country, region, year, locale }),
      params: { year, carryOverMonths, regions },
    })
  ).pipe(
    Effect.catchAll((error) => {
      logger.logError('Error in getHolidays', error, { country, region, year });
      return Effect.succeed([] as HolidayDTO[]);
    })
  );

  return Effect.runPromise(program);
}

import { holidayDTO } from '@application/dto/holiday/dto';
import type { HolidayDTO } from '@application/dto/holiday/types';
import type { Locale } from 'next-intl';
import { getNationalHolidays } from './utils/getNationalHolidays';
import { getRegionalHolidays } from './utils/getRegionalHolidays';
import { getBetterStackInstance } from '@infrastructure/clients/logging/better-stack/client';

interface GetHolidaysParams {
  year: string;
  country?: string;
  carryOverMonths: number;
  region?: string;
  locale: Locale;
}

export async function getHolidays({
  year,
  country,
  region,
  locale,
  carryOverMonths,
}: GetHolidaysParams): Promise<HolidayDTO[]> {
  if (!country) {
    return [];
  }

  try {
    const configuration = {
      languages: [locale],
    };
    const params = {
      country,
      configuration,
      year: Number(year),
    };
    const nationalHolidays = getNationalHolidays(params);
    const regionalHolidays = getRegionalHolidays({ ...params, region });

    return holidayDTO
      .create({
        raw: [...nationalHolidays, ...regionalHolidays],
        params: { year: Number(year), carryOverMonths },
      })
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  } catch (error) {
    getBetterStackInstance().logError('Error in getHolidays', error, { country, region, year });
    return [];
  }
}

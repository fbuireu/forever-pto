import { holidayDTO } from '@application/dto/holiday/dto';
import { HolidayDTO } from '@application/dto/holiday/types';
import { Locale } from 'next-intl';
import { getNationalHolidays } from './utils/getNationalHolidays';
import { getRegionalHolidays } from './utils/getRegionalHolidays';

interface GetHolidaysParams {
  year: string;
  country?: string;
  region?: string;
  locale: Locale;
  carryOverMonths: number;
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
      carryOverMonths,
    };
    const nationalHolidays = getNationalHolidays(params);
    const regionalHolidays = getRegionalHolidays({ ...params, region });

    return holidayDTO
      .create({
        raw: [...nationalHolidays, ...regionalHolidays],
        params: { year: Number(year) },
      })
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  } catch (_) {
    return [];
  }
}

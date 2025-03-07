import { getNationalHolidays } from '@/infrastructure/services/holidays/utils/getNationalHolidays';
import { getRegionalHolidays } from '@/infrastructure/services/holidays/utils/getRegionalHolidays';
import { holidayDTO } from '@/application/dto/holiday/holidayDTO';
import { getUserLanguage } from '@/shared/infrastructure/services/utils/getUserLanguage';
import { getUserTimezone } from '@/shared/infrastructure/services/utils/getUserTimezone';
import { HolidayDTO } from '@/application/dto/holiday/types';

interface GetHolidaysParams {
  year: string,
  country?: string,
  region?: string,
}

export function getHolidays({ year, country, region }: GetHolidaysParams): HolidayDTO[] {
  if (!country) {
    return [];
  }

  try {
    const configuration = {
      languages: getUserLanguage(),
      timezone: getUserTimezone()
    };

    const nationalHolidays = getNationalHolidays({ country, configuration, year: Number(year) });
    const regionalHolidays = getRegionalHolidays({ country, region, configuration, year: Number(year) });

    return holidayDTO.create({
      raw: [...nationalHolidays, ...regionalHolidays],
      configuration: { year: Number(year), countryCode: country }
    }).sort((a, b) => a.date.getTime() - b.date.getTime());
  } catch (error) {
    console.error('Error retrieving holidays:', error);
    return [];
  }
}


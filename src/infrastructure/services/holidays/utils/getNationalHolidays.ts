import Holidays from 'date-holidays';
import { RawHoliday } from '@/application/dto/holiday/types';

interface GetNationalHolidaysParams {
  country: string;
  configuration: {
    languages: string[];
    timezone: string;
  };
  year: number;
}

export function getNationalHolidays({ country, configuration, year }: GetNationalHolidaysParams): RawHoliday[]  {
  const holidays = new Holidays(country, configuration);

  const currentYearHolidays = holidays.getHolidays(year)
  const nextYearHolidays = holidays.getHolidays(year +1)

  return [...currentYearHolidays, ...nextYearHolidays];
}
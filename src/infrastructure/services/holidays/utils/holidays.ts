import Holidays, { type HolidaysTypes } from 'date-holidays';

const NON_WORKING_TYPES = new Set<HolidaysTypes.HolidayType>(['public', 'bank']);

export function getHolidaysForYears(holidays: Holidays, year: number) {
  return [...holidays.getHolidays(year), ...holidays.getHolidays(year + 1)].filter(({ type }) =>
    NON_WORKING_TYPES.has(type)
  );
}

interface GetNationalHolidaysParams {
  country: string;
  configuration: { languages: string[] };
  year: number;
}

export function getNationalHolidays({ country, configuration, year }: GetNationalHolidaysParams) {
  return getHolidaysForYears(new Holidays(country, configuration), year);
}

interface GetRegionalHolidaysParams {
  country: string;
  region?: string;
  configuration: { languages: string[] };
  year: number;
}

export function getRegionalHolidays({ country, region, configuration, year }: GetRegionalHolidaysParams) {
  if (!region) return [];

  return getHolidaysForYears(new Holidays(country, region, configuration), year).map((holiday) => ({
    ...holiday,
    location: region,
  }));
}

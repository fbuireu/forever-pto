import Holidays from 'date-holidays';

interface GetRegionalHolidaysParams {
  country: string;
  region?: string;
  configuration: {
    languages: string[];
  };
  year: number;
}

export function getRegionalHolidays({ country, region, configuration, year }: GetRegionalHolidaysParams) {
  if (!region) {
    return [];
  }

  const holidays = new Holidays(country, region, configuration);
  const currentYearHolidays = holidays.getHolidays(year);
  const nextYearHolidays = holidays.getHolidays(year + 1);

  return [...currentYearHolidays, ...nextYearHolidays].map((holiday) => ({
    ...holiday,
    location: region,
  }));
}

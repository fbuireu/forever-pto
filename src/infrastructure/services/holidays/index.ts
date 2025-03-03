import { eachDayOfInterval } from 'date-fns';
import Holidays from 'date-holidays';
import { cache } from 'react';

export interface Holiday {
  date: Date;
  name: string;
  type?: string;
  location: string | null;
}

export const getHolidays = cache(async (country: string, region: string, year: number) => {
  try {
    const opts = {
      languages: typeof navigator !== 'undefined' ? navigator.languages.map((lang) => lang.split('-')[0]) : ['en'],
      timezone: typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : 'UTC',
    };

    const nationalHolidays = getNationalHolidays(country, opts, year);

    const regionalHolidays = region ? getRegionalHolidays(country, region, opts, year, nationalHolidays) : [];

    return [...nationalHolidays, ...regionalHolidays].toSorted((a, b) => a.date.getTime() - b.date.getTime());
  } catch (error) {
    console.error('Error retrieving holidays:', error);
    return [];
  }
});

function getNationalHolidays(country, opts, year) {
  const hdCountry = new Holidays(country, opts);

  const currentYearHolidays = hdCountry
    .getHolidays(year)
    .filter((holiday) => holiday.type === 'public')
    .flatMap((holiday) => {
      const daysInRange = eachDayOfInterval({
        start: new Date(holiday.start),
        end: new Date(holiday.end),
      });

      return daysInRange.map((date) => ({
        date,
        name: holiday.name,
        type: holiday.type,
        location: null,
      }));
    });

  const nextYear = Number(year) + 1;
  const nextYearHolidays = hdCountry
    .getHolidays(nextYear)
    .filter((holiday) => holiday.type === 'public' && new Date(holiday.start).getMonth() === 0)
    .flatMap((holiday) => {
      const daysInRange = eachDayOfInterval({
        start: new Date(holiday.start),
        end: new Date(holiday.end),
      });

      return daysInRange.map((date) => ({
        date,
        name: `${holiday.name} (siguiente año)`,
        type: holiday.type,
        location: null,
      }));
    });

  return [...currentYearHolidays, ...nextYearHolidays];
}

function getRegionalHolidays(country, region, opts, year, nationalHolidays) {
  const hdRegion = new Holidays(country, region, opts);

  const nationalKeys = new Set(
    nationalHolidays.map((h) => `${h.date.toISOString().split('T')[0]}-${h.name.replace(' (siguiente año)', '')}`)
  );

  const currentYearRegionalHolidays = hdRegion
    .getHolidays(year)
    .filter((holiday) => holiday.type === 'public')
    .flatMap((holiday) => {
      const daysInRange = eachDayOfInterval({
        start: new Date(holiday.start),
        end: new Date(holiday.end),
      });

      return daysInRange.map((date) => {
        const dateStr = date.toISOString().split('T')[0];
        const key = `${dateStr}-${holiday.name}`;

        const isRegionalOnly = !nationalKeys.has(key);

        return {
          date,
          name: holiday.name,
          type: holiday.type,
          location: isRegionalOnly ? region : null,
        };
      });
    })
    .filter((holiday) => holiday.location !== null);

  const nextYear = Number(year) + 1;
  const nextYearRegionalHolidays = hdRegion
    .getHolidays(nextYear)
    .filter((holiday) => holiday.type === 'public' && new Date(holiday.start).getMonth() === 0)
    .flatMap((holiday) => {
      const daysInRange = eachDayOfInterval({
        start: new Date(holiday.start),
        end: new Date(holiday.end),
      });

      return daysInRange.map((date) => {
        const dateStr = date.toISOString().split('T')[0];
        const key = `${dateStr}-${holiday.name}`;

        const isRegionalOnly = !nationalKeys.has(key);

        return {
          date,
          name: `${holiday.name} (siguiente año)`,
          type: holiday.type,
          location: isRegionalOnly ? region : null,
        };
      });
    })
    .filter((holiday) => holiday.location !== null);
console.log(currentYearRegionalHolidays);
  return [...currentYearRegionalHolidays, ...nextYearRegionalHolidays];
}

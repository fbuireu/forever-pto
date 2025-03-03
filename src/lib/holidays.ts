import { eachDayOfInterval } from 'date-fns';
import Holidays from 'date-holidays';
import { cache } from 'react';

export interface Holiday {
  date: Date;
  name: string;
  type?: string; // nacional, regional, religioso, etc.
  location?: string | string[] | null; // país o región específica
}

function getDaysInRange(start: Date, end: Date): Date[] {
  return eachDayOfInterval({ start, end });
}

export const getHolidays = cache(async (country: string, region: string, year: number) => {
  let holidayList: Holiday[] = [];

  try {
    const opts = {
      languages: typeof navigator !== 'undefined' ? navigator.languages.map((lang) => lang.split('-')[0]) : ['en'],
      timezone: typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : 'UTC',
    };

    const hd = region ? new Holidays(country, region, opts) : new Holidays(country, opts);
    console.log(country, region, year);

    const currentYearHolidays = hd
      .getHolidays(year)
      .filter((holiday) => holiday.type === 'public')
      .flatMap((holiday) => {
        const daysInRange = getDaysInRange(new Date(holiday.start), new Date(holiday.end));

        return daysInRange.map((date) => ({
          date,
          name: holiday.name,
          type: holiday.type,
          location: null,
        }));
      });

    const nextYear = Number(year) + 1;
    try {
      const nextYearHolidays = hd
        .getHolidays(nextYear)
        .filter((holiday) => holiday.type === 'public' && new Date(holiday.start).getMonth() === 0)
        .flatMap((holiday) => {
          const daysInRange = getDaysInRange(new Date(holiday.start), new Date(holiday.end));

          return daysInRange.map((date) => ({
            date,
            name: `${holiday.name} (siguiente año)`,
            type: 'public',
            location: null,
          }));
        });

      holidayList = [...currentYearHolidays, ...nextYearHolidays];
    } catch (error) {
      console.error('Error fetching next year holidays:', error);
    }
  } catch (error) {
    console.error('Error retrieving holidays:', error);
  }

  const finalList = holidayList
    .filter((item) => {
      return (
        !item.location ||
        (Array.isArray(item.location) &&
          (item.location.some((loc) => loc?.includes(`-${region?.toUpperCase()}`)) || item.location.length === 0))
      );
    })
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  return finalList;
});

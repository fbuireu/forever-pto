import { HolidayDTO } from '@application/dto/holiday/types';
import { isWeekend } from 'date-fns';

const DATE_KEY_CACHE = new Map<number, string>();
const HOLIDAY_CACHE = new Map<string, Set<string>>();

export const clearDateKeyCache = () => DATE_KEY_CACHE.clear();
export const clearHolidayCache = () => HOLIDAY_CACHE.clear();

export const getKey = (date: Date): string => {
  const time = date.getTime();

  if (!DATE_KEY_CACHE.has(time)) {
    DATE_KEY_CACHE.set(time, `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`);
  }

  return DATE_KEY_CACHE.get(time)!;
};

export const getCombinationKey = (days: Date[]): string => {
  return days
    .map((d) => getKey(d))
    .sort()
    .join(',');
};

export const createHolidaySet = (holidays: HolidayDTO[], cacheKey?: string): Set<string> => {
  const key = cacheKey || 'default';

  if (HOLIDAY_CACHE.has(key)) {
    return HOLIDAY_CACHE.get(key)!;
  }

  const holidaySet = new Set(holidays.filter((h) => !isWeekend(new Date(h.date))).map((h) => getKey(new Date(h.date))));

  HOLIDAY_CACHE.set(key, holidaySet);
  return holidaySet;
};

import type { HolidayDTO } from '@application/dto/holiday/types';
import { isWeekend } from '@shared/utils/date';

const DATE_KEY_CACHE = new Map<number, string>();
const HOLIDAY_CACHE = new Map<string, Set<string>>();

export const clearDateKeyCache = () => DATE_KEY_CACHE.clear();
export const clearHolidayCache = () => HOLIDAY_CACHE.clear();

export const getKey = (date: Date): string => {
  const time = date.getTime();
  const cached = DATE_KEY_CACHE.get(time);

  if (cached !== undefined) return cached;

  const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
  DATE_KEY_CACHE.set(time, key);
  return key;
};

export const getCombinationKey = (days: Date[]): string => {
  return days
    .map((d) => getKey(d))
    .sort((a, b) => a.localeCompare(b))
    .join(',');
};

export const createHolidaySet = (holidays: HolidayDTO[], cacheKey?: string): Set<string> => {
  const key = cacheKey ?? 'default';
  const cached = HOLIDAY_CACHE.get(key);

  if (cached !== undefined) return cached;

  const holidaySet = new Set(holidays.filter((h) => !isWeekend(new Date(h.date))).map((h) => getKey(new Date(h.date))));

  HOLIDAY_CACHE.set(key, holidaySet);
  return holidaySet;
};

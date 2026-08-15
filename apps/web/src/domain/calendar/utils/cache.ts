import type { HolidayDTO } from '@application/dto/holiday/types';
import { isWeekend } from '@application/shared/utils/dates';

const DATE_KEY_CACHE = new Map<number, string>();
const HOLIDAY_CACHE = new Map<string, Set<string>>();

export const clearDateKeyCache = () => DATE_KEY_CACHE.clear();
export const clearHolidayCache = () => HOLIDAY_CACHE.clear();

export const getKey = (date: Date) => {
  const time = date.getTime();
  const cached = DATE_KEY_CACHE.get(time);

  if (cached !== undefined) return cached;

  const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
  DATE_KEY_CACHE.set(time, key);
  return key;
};

export const getCombinationKey = (days: Date[]) => {
  return days
    .map((d) => getKey(d))
    .sort((a, b) => a.localeCompare(b))
    .join(',');
};

export const createHolidaySet = (holidays: HolidayDTO[], cacheKey?: string) => {
  const key = cacheKey ?? 'default';
  const cached = HOLIDAY_CACHE.get(key);

  if (cached !== undefined) return cached;

  const holidaySet = new Set(
    holidays.reduce<string[]>((acc, h) => {
      const date = new Date(h.date);
      if (!isWeekend(date)) acc.push(getKey(date));
      return acc;
    }, [])
  );

  HOLIDAY_CACHE.set(key, holidaySet);
  return holidaySet;
};

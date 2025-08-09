import type { HolidaysState } from '@application/stores/holidays';
import { isBefore, isSameDay, startOfToday } from 'date-fns';

export const isHoliday = (holidays: HolidaysState['holidays']) => {
  return (date: Date) => {
    return holidays.some((holiday) => isSameDay(date, holiday.date));
  };
};

export const isPastDay = (allowPastDays: boolean) => {
  if (allowPastDays) {
    return () => false;
  }

  const today = startOfToday();
  return (date: Date) => isBefore(date, today);
};

// Fixes: https://github.com/date-fns/date-fns/issues/583
export const isToday = (date: Date) => isSameDay(date, new Date());

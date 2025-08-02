import { HolidaysState } from '@application/stores/holidays';
import { isSameDay } from 'date-fns';

export const isHoliday = (holidays: HolidaysState['holidays']) => {
  return (date: Date) => {
    return holidays.some((holiday) => isSameDay(date, holiday.date));
  };
};

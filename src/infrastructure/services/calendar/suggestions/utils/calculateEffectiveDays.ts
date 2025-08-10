import type { HolidayDTO } from '@application/dto/holiday/types';
import { addDays, differenceInDays, isSameDay, isWeekend } from 'date-fns';

export function calculateEffectiveDays(ptoDays: Date[], holidays: HolidayDTO[]): number {
  if (ptoDays.length === 0) return 0;

  const sortedDays = [...ptoDays].sort((a, b) => a.getTime() - b.getTime());
  const firstDay = sortedDays[0];
  const lastDay = sortedDays[sortedDays.length - 1];

  let effectiveDays = differenceInDays(lastDay, firstDay) + 1;

  const isHoliday = (date: Date): boolean => {
    return holidays.some((h) => isSameDay(new Date(h.date), date));
  };

  const isFreeDay = (date: Date): boolean => {
    return isWeekend(date) || isHoliday(date);
  };

  let currentDate = addDays(firstDay, -1);
  let backwardDays = 0;

  while (isFreeDay(currentDate)) {
    backwardDays++;
    currentDate = addDays(currentDate, -1);
  }

  effectiveDays += backwardDays;

  currentDate = addDays(lastDay, 1);
  let forwardDays = 0;

  while (isFreeDay(currentDate)) {
    forwardDays++;
    currentDate = addDays(currentDate, 1);
  }

  effectiveDays += forwardDays;

  return effectiveDays;
}

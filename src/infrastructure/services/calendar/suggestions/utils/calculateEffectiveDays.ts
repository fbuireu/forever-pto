import type { HolidayDTO } from '@application/dto/holiday/types';
import { addDays, isSameDay, isWeekend } from 'date-fns';

export function calculateEffectiveDays(ptoDays: Date[], holidays: HolidayDTO[]): number {
  if (ptoDays.length === 0) return 0;

  const sortedDays = [...ptoDays].sort((a, b) => a.getTime() - b.getTime());
  const firstDay = sortedDays[0];
  const lastDay = sortedDays[sortedDays.length - 1];

  let effectiveDays = 0;
  let currentDate = new Date(firstDay);

  while (currentDate <= lastDay) {
    effectiveDays++;
    currentDate = addDays(currentDate, 1);
  }

  const dayBefore = addDays(firstDay, -1);
  const dayAfter = addDays(lastDay, 1);

  // Check weekend or holiday before
  if (isWeekend(dayBefore) || holidays.some((h) => isSameDay(new Date(h.date), dayBefore))) {
    let checkDay = addDays(dayBefore, -1);
    while (isWeekend(checkDay) || holidays.some((h) => isSameDay(new Date(h.date), checkDay))) {
      effectiveDays++;
      checkDay = addDays(checkDay, -1);
    }
    effectiveDays++;
  }

  // Check weekend or holiday after
  if (isWeekend(dayAfter) || holidays.some((h) => isSameDay(new Date(h.date), dayAfter))) {
    let checkDay = dayAfter;
    while (isWeekend(checkDay) || holidays.some((h) => isSameDay(new Date(h.date), checkDay))) {
      effectiveDays++;
      checkDay = addDays(checkDay, 1);
    }
  }

  return effectiveDays;
}

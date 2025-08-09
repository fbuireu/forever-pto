import type { HolidayDTO } from '@application/dto/holiday/types';
import { ensureDate } from '@shared/utils/dates';
import { eachDayOfInterval, endOfMonth, isSameDay, isWeekend, startOfMonth } from 'date-fns';

export function getAvailableWorkdays({
  months,
  holidays,
  allowPastDays,
}: {
  months: Date[];
  holidays: HolidayDTO[];
  allowPastDays: boolean;
}) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const workdays: Date[] = [];

  for (const month of months) {
    const days = eachDayOfInterval({
      start: startOfMonth(month),
      end: endOfMonth(month),
    });

    for (const day of days) {
      if (!allowPastDays && day < today) continue;
      if (isWeekend(day)) continue;

      const isHoliday = holidays.some((h) => isSameDay(ensureDate(h.date), day));
      if (isHoliday) continue;

      workdays.push(day);
    }
  }

  return workdays;
}

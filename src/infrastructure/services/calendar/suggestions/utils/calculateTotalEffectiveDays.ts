import type { HolidayDTO } from '@application/dto/holiday/types';
import { differenceInDays, isWeekend, isSameDay, addDays, subDays } from 'date-fns';

export function calculateTotalEffectiveDays(ptoDays: Date[], holidays: HolidayDTO[]): number {
  if (ptoDays.length === 0) return 0;

  // Sort days chronologically
  const sortedDays = [...ptoDays].sort((a, b) => a.getTime() - b.getTime());

  // Group consecutive days into ranges
  const ranges: { start: Date; end: Date }[] = [];
  let currentRangeStart = sortedDays[0];
  let currentRangeEnd = sortedDays[0];

  for (let i = 1; i < sortedDays.length; i++) {
    const dayDiff = differenceInDays(sortedDays[i], currentRangeEnd);

    if (dayDiff <= 4) {
      // If within 4 days, extend current range
      currentRangeEnd = sortedDays[i];
    } else {
      // Start new range
      ranges.push({ start: currentRangeStart, end: currentRangeEnd });
      currentRangeStart = sortedDays[i];
      currentRangeEnd = sortedDays[i];
    }
  }
  ranges.push({ start: currentRangeStart, end: currentRangeEnd });

  // Calculate effective days for all ranges
  let totalEffective = 0;

  const isHoliday = (date: Date) => holidays.some((h) => isSameDay(new Date(h.date), date));
  const isFreeDay = (date: Date) => isWeekend(date) || isHoliday(date);

  ranges.forEach((range) => {
    // Count days in range
    totalEffective += differenceInDays(range.end, range.start) + 1;

    // Add free days before the range
    let before = subDays(range.start, 1);
    while (isFreeDay(before)) {
      totalEffective++;
      before = subDays(before, 1);
    }

    // Add free days after the range
    let after = addDays(range.end, 1);
    while (isFreeDay(after)) {
      totalEffective++;
      after = addDays(after, 1);
    }
  });

  return totalEffective;
}

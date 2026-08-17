import type { HolidayDTO } from '@application/dto/holiday/types';
import { addDays, eachDayOfInterval, isWeekend } from '@application/shared/utils/dates';
import { PTO_CONSTANTS } from '@domain/calendar/const';
import { dayKey, dayOffKeys } from './dayOff';

export interface FreeStreak {
  days: Date[];
  length: number;
  hasPlacedDay: boolean;
  hasWeekend: boolean;
}

interface FreeStreaksParams {
  placedDays: Date[];
  holidays: HolidayDTO[];
}

export function freeStreaks({ placedDays, holidays }: FreeStreaksParams): FreeStreak[] {
  if (placedDays.length === 0) return [];

  const placed = new Set(placedDays.map(dayKey));
  const free = dayOffKeys({ placedDays, holidays });

  const allDates = [...placedDays, ...holidays.map((holiday) => holiday.date)].toSorted(
    (a, b) => a.getTime() - b.getTime()
  );
  const firstDate = allDates.at(0);
  const lastDate = allDates.at(-1);
  if (firstDate === undefined || lastDate === undefined) return [];

  const streaks: FreeStreak[] = [];
  let current: Date[] = [];

  const close = () => {
    if (current.length > 0) {
      streaks.push({
        days: current,
        length: current.length,
        hasPlacedDay: current.some((day) => placed.has(dayKey(day))),
        hasWeekend: current.some(isWeekend),
      });
    }
    current = [];
  };

  const scan = eachDayOfInterval({
    start: addDays(firstDate, -PTO_CONSTANTS.METRICS.STREAK_SCAN_MARGIN_DAYS),
    end: addDays(lastDate, PTO_CONSTANTS.METRICS.STREAK_SCAN_MARGIN_DAYS),
  });

  for (const day of scan) {
    if (isWeekend(day) || free.has(dayKey(day))) current.push(day);
    else close();
  }
  close();

  return streaks;
}

import type { HolidayDTO } from '@application/dto/holiday/types';

const holidaySetCache = new WeakMap<HolidayDTO[], Set<string>>();

export function calculateTotalEffectiveDays(ptoDays: Date[], holidays: HolidayDTO[]): number {
  if (ptoDays.length === 0) return 0;

  let holidaySet = holidaySetCache.get(holidays);
  if (!holidaySet) {
    holidaySet = createHolidaySet(holidays);
    holidaySetCache.set(holidays, holidaySet);
  }

  const sortedDays = [...ptoDays].sort((a, b) => a.getTime() - b.getTime());

  const ranges: { start: Date; end: Date }[] = [];
  let currentRange = { start: sortedDays[0], end: sortedDays[0] };

  for (let i = 1; i < sortedDays.length; i++) {
    const prevDay = sortedDays[i - 1];
    const currentDay = sortedDays[i];

    const daysDiff = Math.floor((currentDay.getTime() - prevDay.getTime()) / (1000 * 60 * 60 * 24));

    if (daysDiff === 1) {
      currentRange.end = currentDay;
    } else {
      ranges.push(currentRange);
      currentRange = { start: currentDay, end: currentDay };
    }
  }
  ranges.push(currentRange);

  let totalEffectiveDays = 0;

  for (const range of ranges) {
    const rangeEffectiveDays = calculateRangeEffectiveDays(range.start, range.end, holidaySet);
    totalEffectiveDays += rangeEffectiveDays;
  }

  return totalEffectiveDays;
}

function createHolidaySet(holidays: HolidayDTO[]): Set<string> {
  const holidaySet = new Set<string>();
  for (const holiday of holidays) {
    const date = new Date(holiday.date);
    const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    holidaySet.add(key);
  }
  return holidaySet;
}

function calculateRangeEffectiveDays(start: Date, end: Date, holidaySet: Set<string>): number {
  const current = new Date(start);
  let effectiveDays = 0;

  while (current <= end) {
    const dayOfWeek = current.getDay();

    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      effectiveDays++;
    }

    const beforeKey = createDateKey(new Date(current.getTime() - 24 * 60 * 60 * 1000));
    const afterKey = createDateKey(new Date(current.getTime() + 24 * 60 * 60 * 1000));

    if (holidaySet.has(beforeKey) || holidaySet.has(afterKey)) {
      if (dayOfWeek === 1) {
        effectiveDays += 2;
      } else if (dayOfWeek === 5) {
        effectiveDays += 2;
      } else if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        effectiveDays += 1;
      }
    }

    current.setDate(current.getDate() + 1);
  }

  return effectiveDays;
}

function createDateKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

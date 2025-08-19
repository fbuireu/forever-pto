import { HolidayDTO } from '@application/dto/holiday/types';
import { addDays, differenceInDays, isWeekend } from 'date-fns';
import { createHolidaySet, getKey } from './cache';

export const calculateEffectiveDays = (days: Date[], holidays: HolidayDTO[]): number => {
  if (days.length === 0) return 0;

  const sortedDays = [...days].sort((a, b) => a.getTime() - b.getTime());
  const holidaySet = createHolidaySet(holidays);

  let totalDays = 0;
  let currentBlockStart = sortedDays[0];
  let currentBlockEnd = sortedDays[0];

  for (let i = 1; i < sortedDays.length; i++) {
    const daysDiff = differenceInDays(sortedDays[i], currentBlockEnd);

    if (daysDiff <= 7) {
      // MAX_DAYS_DIFF
      currentBlockEnd = sortedDays[i];
    } else {
      // Calcular días efectivos del bloque actual
      totalDays += calculateBlockEffectiveDays(currentBlockStart, currentBlockEnd, holidaySet);
      // Iniciar nuevo bloque
      currentBlockStart = sortedDays[i];
      currentBlockEnd = sortedDays[i];
    }
  }

  totalDays += calculateBlockEffectiveDays(currentBlockStart, currentBlockEnd, holidaySet);

  return totalDays;
};

const calculateBlockEffectiveDays = (start: Date, end: Date, holidaySet: Set<string>): number => {
  let expandedStart = start;
  let expandedEnd = end;

  let current = addDays(start, -1);
  let safetyCounter = 0;

  while ((isWeekend(current) || holidaySet.has(getKey(current))) && safetyCounter < 30) {
    expandedStart = current;
    current = addDays(current, -1);
    safetyCounter++;
  }

  current = addDays(end, 1);
  safetyCounter = 0;

  while ((isWeekend(current) || holidaySet.has(getKey(current))) && safetyCounter < 30) {
    expandedEnd = current;
    current = addDays(current, 1);
    safetyCounter++;
  }

  return differenceInDays(expandedEnd, expandedStart) + 1;
};


export const calculateFreePeriods = (
  workdays: Date[],
  holidaySet: Set<string>
): Array<{ start: Date; end: Date; days: number }> => {
  const periods: Array<{ start: Date; end: Date; days: number }> = [];

  if (workdays.length === 0) return periods;

  const startDate = workdays[0];
  const endDate = workdays[workdays.length - 1];

  let current = new Date(startDate);
  let periodStart: Date | null = null;

  while (current <= endDate) {
    const isFree = isWeekend(current) || holidaySet.has(getKey(current));

    if (isFree) {
      periodStart ??= new Date(current);
    } else if (periodStart) {
      const periodEnd = addDays(current, -1);
      periods.push({
        start: periodStart,
        end: periodEnd,
        days: differenceInDays(periodEnd, periodStart) + 1,
      });
      periodStart = null;
    }

    current = addDays(current, 1);
  }

  if (periodStart) {
    periods.push({
      start: periodStart,
      end: new Date(current),
      days: differenceInDays(current, periodStart) + 1,
    });
  }

  return periods;
};
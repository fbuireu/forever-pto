import { HolidayDTO } from "@application/dto/holiday/types";
import { differenceInDays, addDays, isWeekend } from "date-fns";
import { createOptimizedHolidaySet, getOptimizedDateKey } from "./cache";

export const calculateEffectiveDaysOptimized = (days: Date[], holidays: HolidayDTO[]): number => {
  if (days.length === 0) return 0;

  const sortedDays = [...days].sort((a, b) => a.getTime() - b.getTime());
  const holidaySet = createOptimizedHolidaySet(holidays);

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

  while ((isWeekend(current) || holidaySet.has(getOptimizedDateKey(current))) && safetyCounter < 30) {
    expandedStart = current;
    current = addDays(current, -1);
    safetyCounter++;
  }

  current = addDays(end, 1);
  safetyCounter = 0;

  while ((isWeekend(current) || holidaySet.has(getOptimizedDateKey(current))) && safetyCounter < 30) {
    expandedEnd = current;
    current = addDays(current, 1);
    safetyCounter++;
  }

  return differenceInDays(expandedEnd, expandedStart) + 1;
};

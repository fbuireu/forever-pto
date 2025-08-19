import { addDays, differenceInDays, isWeekend } from 'date-fns';
import { PTO_CONSTANTS } from '../../const';
import { Bridge } from '../../types';
import { getKey } from '../../utils/cache';
import { createDateSet, hasDateConflict, isFreeDay } from '../../utils/helpers';

export function groupConsecutiveDays(days: Date[]): Array<{ start: Date; end: Date }> {
  if (days.length === 0) return [];

  const ranges: Array<{ start: Date; end: Date }> = [];
  let currentStart = days[0];
  let currentEnd = days[0];

  for (let i = 1; i < days.length; i++) {
    const daysDiff = differenceInDays(days[i], currentEnd);

    if (daysDiff <= PTO_CONSTANTS.DAY_GROUPING.MAX_DAYS_DIFF_FOR_RANGE) {
      currentEnd = days[i];
    } else {
      ranges.push({ start: currentStart, end: currentEnd });
      currentStart = days[i];
      currentEnd = days[i];
    }
  }

  ranges.push({ start: currentStart, end: currentEnd });

  return ranges;
}

export function expandRange(range: { start: Date; end: Date }, holidaySet: Set<string>): { start: Date; end: Date } {
  let expandedStart = range.start;
  let expandedEnd = range.end;

  let before = addDays(expandedStart, -1);
  let safetyCounter = 0;

  while (isFreeDay(before, holidaySet) && safetyCounter < PTO_CONSTANTS.SAFETY_LIMIT) {
    expandedStart = before;
    before = addDays(before, -1);
    safetyCounter++;
  }

  let after = addDays(expandedEnd, 1);
  safetyCounter = 0;

  while (isFreeDay(after, holidaySet) && safetyCounter < PTO_CONSTANTS.SAFETY_LIMIT) {
    expandedEnd = after;
    after = addDays(after, 1);
    safetyCounter++;
  }

  return { start: expandedStart, end: expandedEnd };
}

export function selectOptimalBridges(bridges: Bridge[], targetPtoDays: number): Bridge[] {
  const selected: Bridge[] = [];
  const usedDates = createDateSet([]);
  let totalPtoDays = 0;

  for (const bridge of bridges) {
    if (totalPtoDays >= targetPtoDays) break;

    if (!hasDateConflict(bridge.ptoDays, usedDates) && totalPtoDays + bridge.ptoDaysNeeded <= targetPtoDays) {
      selected.push(bridge);
      bridge.ptoDays.forEach((day) => usedDates.add(getKey(day)));
      totalPtoDays += bridge.ptoDaysNeeded;
    }
  }

  return selected;
}

export function findAdjacentWorkday(
  currentDays: Date[],
  availableWorkdays: Date[],
  usedDates: Set<string>
): Date | null {
  if (currentDays.length === 0) return null;

  const sortedDays = [...currentDays].sort((a, b) => a.getTime() - b.getTime());
  const firstDay = sortedDays[0];
  const lastDay = sortedDays[sortedDays.length - 1];

  const nextDay = addDays(lastDay, 1);
  if (!isWeekend(nextDay) && !usedDates.has(getKey(nextDay))) {
    const isAvailable = availableWorkdays.some((d) => d.getTime() === nextDay.getTime());
    if (isAvailable) return nextDay;
  }

  const prevDay = addDays(firstDay, -1);
  if (!isWeekend(prevDay) && !usedDates.has(getKey(prevDay))) {
    const isAvailable = availableWorkdays.some((d) => d.getTime() === prevDay.getTime());
    if (isAvailable) return prevDay;
  }

  for (let i = 2; i <= PTO_CONSTANTS.DAY_GROUPING.MAX_SEARCH_DISTANCE; i++) {
    const candidateNext = addDays(lastDay, i);
    const candidatePrev = addDays(firstDay, -i);

    if (!isWeekend(candidateNext) && !usedDates.has(getKey(candidateNext))) {
      const isAvailable = availableWorkdays.some((d) => d.getTime() === candidateNext.getTime());
      if (isAvailable) return candidateNext;
    }

    if (!isWeekend(candidatePrev) && !usedDates.has(getKey(candidatePrev))) {
      const isAvailable = availableWorkdays.some((d) => d.getTime() === candidatePrev.getTime());
      if (isAvailable) return candidatePrev;
    }
  }

  return null;
}

import { HolidayDTO } from '@application/dto/holiday/types';
import { addDays, differenceInDays, isWeekend } from 'date-fns';
import { PTO_CONSTANTS } from '../const';
import { Bridge } from '../types';
import { createHolidaySet, getKey } from './cache';

interface GetAvailableWorkdaysParams {
  months: Date[];
  holidays: HolidayDTO[];
  allowPastDays: boolean;
}

export function getAvailableWorkdays({ months, holidays, allowPastDays }: GetAvailableWorkdaysParams): Date[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayTime = today.getTime();

  const holidaySet = createHolidaySet(holidays);
  const workdays: Date[] = [];

  for (const month of months) {
    const year = month.getFullYear();
    const monthNum = month.getMonth();
    const daysInMonth = new Date(year, monthNum + 1, 0).getDate();

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, monthNum, day);

      if (!allowPastDays && date.getTime() < todayTime) continue;
      if (isWeekend(date)) continue;
      if (holidaySet.has(getKey(date))) continue;

      workdays.push(date);
    }
  }

  return workdays;
}

interface FindBridgesParams {
  availableWorkdays: Date[];
  holidays: HolidayDTO[];
}

export const findBridges = ({ availableWorkdays, holidays }: FindBridgesParams): Bridge[] => {
  if (availableWorkdays.length === 0) return [];
  const { MAX_MULTI_DAY_SIZE, MIN_MULTI_DAY_SIZE } = PTO_CONSTANTS.BRIDGE_SEARCH;

  const holidaySet = createHolidaySet(holidays);
  const bridges: Bridge[] = [];

  const sortedWorkdays = [...availableWorkdays].sort((a, b) => a.getTime() - b.getTime());

  for (const workday of sortedWorkdays) {
    const singleBridge = analyzePotentialBridge({ ptoDays: [workday], holidaySet });
    if (singleBridge) {
      bridges.push(singleBridge);
    }

    for (let size = MIN_MULTI_DAY_SIZE; size <= MAX_MULTI_DAY_SIZE; size++) {
      const multiDays: Date[] = [workday];

      for (let i = 1; i < size; i++) {
        const nextDay = addDays(workday, i);
        if (sortedWorkdays.some((d) => d.getTime() === nextDay.getTime())) {
          multiDays.push(nextDay);
        } else {
          break;
        }
      }

      if (multiDays.length === size) {
        const multiBridge = analyzePotentialBridge({ ptoDays: multiDays, holidaySet });
        if (multiBridge) {
          bridges.push(multiBridge);
        }
      }
    }
  }

  const uniqueBridges = deduplicateBridges(bridges);

  return uniqueBridges.sort((a, b) => {
    const effDiff = b.efficiency - a.efficiency;
    if (Math.abs(effDiff) > PTO_CONSTANTS.BRIDGE_GENERATION.EFFICIENCY_COMPARISON_THRESHOLD) {
      return effDiff;
    }
    return b.effectiveDays - a.effectiveDays;
  });
};

interface AnalyzePotentialBridgesParams {
  ptoDays: Date[];
  holidaySet: Set<string>;
}

function analyzePotentialBridge({ ptoDays, holidaySet }: AnalyzePotentialBridgesParams): Bridge | null {
  if (ptoDays.length === 0) return null;
  const {
    SAFETY_LIMIT,
    EFFICIENCY: { MINIMUM },
  } = PTO_CONSTANTS;

  const sortedDays = [...ptoDays].sort((a, b) => a.getTime() - b.getTime());
  const firstDay = sortedDays[0];
  const lastDay = sortedDays[sortedDays.length - 1];

  let hasAdjacentFreeDay = false;

  for (const day of sortedDays) {
    const prevDay = addDays(day, -1);
    const nextDay = addDays(day, 1);

    const prevIsFree = isWeekend(prevDay) || holidaySet.has(getKey(prevDay));
    const nextIsFree = isWeekend(nextDay) || holidaySet.has(getKey(nextDay));

    if (prevIsFree || nextIsFree) {
      hasAdjacentFreeDay = true;
      break;
    }
  }

  if (!hasAdjacentFreeDay) {
    return null;
  }

  let effectiveStart = firstDay;
  let effectiveEnd = lastDay;

  let current = addDays(firstDay, -1);
  let expansionCount = 0;

  while ((isWeekend(current) || holidaySet.has(getKey(current))) && expansionCount < SAFETY_LIMIT) {
    effectiveStart = current;
    current = addDays(current, -1);
    expansionCount++;
  }

  current = addDays(lastDay, 1);
  expansionCount = 0;

  while ((isWeekend(current) || holidaySet.has(getKey(current))) && expansionCount < SAFETY_LIMIT) {
    effectiveEnd = current;
    current = addDays(current, 1);
    expansionCount++;
  }

  const effectiveDays = differenceInDays(effectiveEnd, effectiveStart) + 1;
  const efficiency = effectiveDays / ptoDays.length;

  if (efficiency >= MINIMUM) {
    return {
      startDate: effectiveStart,
      endDate: effectiveEnd,
      ptoDaysNeeded: ptoDays.length,
      effectiveDays,
      efficiency,
      ptoDays: sortedDays,
    };
  }

  return null;
}

function deduplicateBridges(bridges: Bridge[]): Bridge[] {
  const seen = new Map<string, Bridge>();

  for (const bridge of bridges) {
    const key = bridge.ptoDays
      .map((d) => getKey(d))
      .sort((a, b) => a.localeCompare(b))
      .join(',');
    const existing = seen.get(key);

    if (!existing || bridge.efficiency > existing.efficiency) {
      seen.set(key, bridge);
    }
  }

  return Array.from(seen.values());
}

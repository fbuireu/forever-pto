import { HolidayDTO } from '@application/dto/holiday/types';
import { addDays, differenceInDays, isWeekend } from 'date-fns';
import { Bridge, Suggestion } from '../types';
import { createHolidaySet, getCombinationKey, getKey } from './cache';
import { calculateFreePeriods } from './calculators';
import { PTO_CONSTANTS } from '../const';

export const deduplicateDays = (days: Date[]): Date[] => {
  const uniqueKeys = new Set<string>();
  const uniqueDays: Date[] = [];

  for (const day of days) {
    const key = getKey(day);
    if (!uniqueKeys.has(key)) {
      uniqueKeys.add(key);
      uniqueDays.push(day);
    }
  }

  return uniqueDays.sort((a, b) => a.getTime() - b.getTime());
};

export const createDateSet = (dates: Date[]): Set<string> => new Set(dates.map((date) => getKey(date)));

export const areSuggestionsEqual = (s1: Suggestion, s2: Suggestion): boolean => {
  if (s1.days.length !== s2.days.length) return false;

  const set1 = createDateSet(s1.days);
  const set2 = createDateSet(s2.days);

  for (const key of set1) {
    if (!set2.has(key)) return false;
  }
  return true;
};

export const filterDuplicateAlternatives = (alternatives: Suggestion[], mainSuggestion: Suggestion): Suggestion[] => {
  const usedKeys = new Set<string>();
  usedKeys.add(getCombinationKey(mainSuggestion.days));

  return alternatives.filter((alt) => {
    const key = getCombinationKey(alt.days);
    if (usedKeys.has(key)) return false;
    usedKeys.add(key);
    return true;
  });
};

export function getAvailableWorkdays({
  months,
  holidays,
  allowPastDays,
}: {
  months: Date[];
  holidays: HolidayDTO[];
  allowPastDays: boolean;
}): Date[] {
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

export function isFreeDay(date: Date, holidaySet: Set<string>): boolean {
  return isWeekend(date) || holidaySet.has(getKey(date));
}

export const hasDateConflict = (newDays: Date[], existingDays: Set<string>): boolean => {
  return newDays.some((day) => existingDays.has(getKey(day)));
};

export const addDaysToSet = (days: Date[], targetSet: Set<string>): void => {
  for (const day of days) {
    targetSet.add(getKey(day));
  }
};

export const findBridges = (availableWorkdays: Date[], holidays: HolidayDTO[]): Bridge[] => {
  if (availableWorkdays.length === 0) return [];

  const holidaySet = createHolidaySet(holidays);
  const bridges: Bridge[] = [];
  const processedDays = new Set<string>();

  // Sort workdays chronologically for efficient processing
  const sortedWorkdays = [...availableWorkdays].sort((a, b) => a.getTime() - b.getTime());

  // Find single-day bridges (most efficient)
  for (const workday of sortedWorkdays) {
    const key = getKey(workday);
    if (processedDays.has(key)) continue;

    const bridge = findSingleDayBridge(workday, holidaySet);
    if (bridge && bridge.efficiency >= PTO_CONSTANTS.EFFICIENCY.MINIMUM_FOR_SINGLE_BRIDGE) {
      bridges.push(bridge);
      processedDays.add(key);
    }
  }

  // Find multi-day bridges for longer stretches
  const multiDayBridges = findMultiDayBridges(sortedWorkdays, holidaySet, processedDays);
  bridges.push(...multiDayBridges);

  // Sort by efficiency (primary) and total effective days (secondary)
  return bridges.sort((a, b) => {
    const effDiff = b.efficiency - a.efficiency;
    if (Math.abs(effDiff) > PTO_CONSTANTS.BRIDGE_GENERATION.EFFICIENCY_COMPARISON_THRESHOLD) {
      return effDiff;
    }
    return b.effectiveDays - a.effectiveDays;
  });
};

function findSingleDayBridge(workday: Date, holidaySet: Set<string>): Bridge | null {
  // Check if this workday creates a bridge between weekend/holiday periods
  const prevDay = addDays(workday, -1);
  const nextDay = addDays(workday, 1);

  const prevIsFree = isWeekend(prevDay) || holidaySet.has(getKey(prevDay));
  const nextIsFree = isWeekend(nextDay) || holidaySet.has(getKey(nextDay));

  // If workday is between free periods, calculate the total stretch
  if (prevIsFree && nextIsFree) {
    let start = workday;
    let end = workday;

    // Expand backwards through consecutive free days
    let current = prevDay;
    let expansionCount = 0;
    while (
      (isWeekend(current) || holidaySet.has(getKey(current))) &&
      expansionCount < PTO_CONSTANTS.MAX_EXPANSION_DISTANCE
    ) {
      start = current;
      current = addDays(current, -1);
      expansionCount++;
    }

    // Expand forwards through consecutive free days
    current = nextDay;
    expansionCount = 0;
    while (
      (isWeekend(current) || holidaySet.has(getKey(current))) &&
      expansionCount < PTO_CONSTANTS.MAX_EXPANSION_DISTANCE
    ) {
      end = current;
      current = addDays(current, 1);
      expansionCount++;
    }

    const effectiveDays = differenceInDays(end, start) + 1;
    const efficiency = effectiveDays; // 1 PTO day gives effectiveDays off

    return {
      startDate: start,
      endDate: end,
      ptoDaysNeeded: 1,
      effectiveDays,
      efficiency,
      ptoDays: [workday],
      type: classifyBridgeType(efficiency),
    };
  }

  // Check for Friday or Monday adjacent to holiday
  const isFriday = workday.getDay() === 5;
  const isMonday = workday.getDay() === 1;

  if (isFriday) {
    // Check if following Monday is a holiday
    const monday = addDays(workday, 3);
    if (holidaySet.has(getKey(monday))) {
      return createBridge(workday, monday, [workday], holidaySet);
    }
  }

  if (isMonday) {
    // Check if previous Friday is a holiday
    const friday = addDays(workday, -3);
    if (holidaySet.has(getKey(friday))) {
      return createBridge(friday, workday, [workday], holidaySet);
    }
  }

  return null;
}

function findMultiDayBridges(workdays: Date[], holidaySet: Set<string>, processedDays: Set<string>): Bridge[] {
  const bridges: Bridge[] = [];
  const workdaySet = new Set(workdays.map((d) => getKey(d)));

  // Find gaps between holiday periods that can be bridged
  const holidayPeriods = findHolidayPeriods(holidaySet, workdays);

  for (let i = 0; i < holidayPeriods.length - 1; i++) {
    const period1 = holidayPeriods[i];
    const period2 = holidayPeriods[i + 1];

    const gapStart = addDays(period1.end, 1);
    const gapEnd = addDays(period2.start, -1);
    const gapDays = differenceInDays(gapEnd, gapStart) + 1;

    // Only consider small gaps that can be efficiently bridged
    if (gapDays > 0 && gapDays <= PTO_CONSTANTS.MAX_GAP_FOR_BRIDGE) {
      const ptoDays: Date[] = [];
      let current = new Date(gapStart);

      while (current <= gapEnd) {
        if (!isWeekend(current) && workdaySet.has(getKey(current)) && !processedDays.has(getKey(current))) {
          ptoDays.push(new Date(current));
        }
        current = addDays(current, 1);
      }

      if (ptoDays.length > 0 && ptoDays.length <= 3) {
        const totalEffectiveDays = differenceInDays(period2.end, period1.start) + 1;
        const efficiency = totalEffectiveDays / ptoDays.length;

        if (efficiency >= PTO_CONSTANTS.EFFICIENCY.MINIMUM) {
          bridges.push({
            startDate: period1.start,
            endDate: period2.end,
            ptoDaysNeeded: ptoDays.length,
            effectiveDays: totalEffectiveDays,
            efficiency,
            ptoDays,
            type: classifyBridgeType(efficiency),
          });
        }
      }
    }
  }

  return bridges;
}

function findHolidayPeriods(holidaySet: Set<string>, workdays: Date[]): Array<{ start: Date; end: Date }> {
  if (workdays.length === 0) return [];

  const periods: Array<{ start: Date; end: Date }> = [];
  const startDate = workdays[0];
  const endDate = workdays[workdays.length - 1];

  let current = new Date(startDate);
  let periodStart: Date | null = null;

  while (current <= endDate) {
    const isFree = isWeekend(current) || holidaySet.has(getKey(current));

    if (isFree) {
      if (!periodStart) {
        periodStart = new Date(current);
      }
    } else if (periodStart) {
      periods.push({
        start: periodStart,
        end: addDays(current, -1),
      });
      periodStart = null;
    }

    current = addDays(current, 1);
  }

  // Close last period if needed
  if (periodStart) {
    periods.push({
      start: periodStart,
      end: new Date(current),
    });
  }

  return periods;
}

function createBridge(start: Date, end: Date, ptoDays: Date[], holidaySet: Set<string>): Bridge {
  // Expand the bridge to include adjacent free days
  let expandedStart = start;
  let expandedEnd = end;

  let current = addDays(start, -1);
  let count = 0;
  while ((isWeekend(current) || holidaySet.has(getKey(current))) && count < PTO_CONSTANTS.MAX_EXPANSION_DISTANCE) {
    expandedStart = current;
    current = addDays(current, -1);
    count++;
  }

  current = addDays(end, 1);
  count = 0;
  while ((isWeekend(current) || holidaySet.has(getKey(current))) && count < PTO_CONSTANTS.MAX_EXPANSION_DISTANCE) {
    expandedEnd = current;
    current = addDays(current, 1);
    count++;
  }

  const effectiveDays = differenceInDays(expandedEnd, expandedStart) + 1;
  const efficiency = effectiveDays / ptoDays.length;

  return {
    startDate: expandedStart,
    endDate: expandedEnd,
    ptoDaysNeeded: ptoDays.length,
    effectiveDays,
    efficiency,
    ptoDays,
    type: classifyBridgeType(efficiency),
  };
}

function classifyBridgeType(efficiency: number): Bridge['type'] {
  if (efficiency >= PTO_CONSTANTS.EFFICIENCY.PERFECT) return 'perfect';
  if (efficiency >= PTO_CONSTANTS.EFFICIENCY.GOOD) return 'good';
  if (efficiency >= PTO_CONSTANTS.EFFICIENCY.ACCEPTABLE) return 'acceptable';
  return 'regular';
}

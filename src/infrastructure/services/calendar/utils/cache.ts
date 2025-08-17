import { HolidayDTO } from '@application/dto/holiday/types';
import { addDays, differenceInDays, isWeekend } from 'date-fns';
import { Bridge } from '../types';

const dateKeyCache = new Map<number, string>();

export const getOptimizedDateKey = (date: Date): string => {
  const time = date.getTime();

  if (!dateKeyCache.has(time)) {
    dateKeyCache.set(time, `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`);
  }

  return dateKeyCache.get(time)!;
};

export const clearDateKeyCache = () => {
  dateKeyCache.clear();
};

const holidaySetCache = new Map<string, Set<string>>();

export const createOptimizedHolidaySet = (holidays: HolidayDTO[], cacheKey?: string): Set<string> => {
  const key = cacheKey || 'default';

  if (holidaySetCache.has(key)) {
    return holidaySetCache.get(key)!;
  }

  const holidaySet = new Set(
    holidays.filter((h) => !isWeekend(new Date(h.date))).map((h) => getOptimizedDateKey(new Date(h.date)))
  );

  holidaySetCache.set(key, holidaySet);
  return holidaySet;
};

export const clearHolidayCache = () => {
  holidaySetCache.clear();
};

export const findBridgesOptimized = (availableWorkdays: Date[], holidays: HolidayDTO[]): Bridge[] => {
  if (availableWorkdays.length === 0) return [];

  const holidaySet = createOptimizedHolidaySet(holidays);
  const workdayIndex = new Set(availableWorkdays.map((d) => getOptimizedDateKey(d)));

  const freePeriods = calculateFreePeriods(availableWorkdays, holidaySet);

  const bridges: Bridge[] = [];

  for (const workday of availableWorkdays) {
    const bridge = analyzeSingleDayOptimized(workday, holidaySet, freePeriods);
    if (bridge && bridge.efficiency >= 3) {
      // MIN_EFFICIENCY_FOR_SINGLE_BRIDGE
      bridges.push(bridge);
    }
  }

  const multiDayBridges = findMultiDayBridgesOptimized(freePeriods, workdayIndex);
  bridges.push(...multiDayBridges);

  return deduplicateAndSortBridges(bridges);
};


const calculateFreePeriods = (
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
    const isFree = isWeekend(current) || holidaySet.has(getOptimizedDateKey(current));

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

  // Cerrar último período si existe
  if (periodStart) {
    periods.push({
      start: periodStart,
      end: new Date(current),
      days: differenceInDays(current, periodStart) + 1,
    });
  }

  return periods;
};


const analyzeSingleDayOptimized = (
  day: Date,
  holidaySet: Set<string>,
  freePeriods: Array<{ start: Date; end: Date; days: number }>
): Bridge | null => {
  // Buscar si el día está adyacente a un período libre
  const dayTime = day.getTime();

  for (const period of freePeriods) {
    const prevDay = addDays(period.end, 1);
    const nextDay = addDays(period.start, -1);

    if (prevDay.getTime() === dayTime || nextDay.getTime() === dayTime) {
      const effectiveDays = period.days + 1;

      if (effectiveDays >= 3) {
        // MINIMUM_FOR_BRIDGE_CREATION
        return {
          startDate: prevDay.getTime() === dayTime ? day : period.start,
          endDate: nextDay.getTime() === dayTime ? day : period.end,
          ptoDaysNeeded: 1,
          effectiveDays,
          efficiency: effectiveDays,
          ptoDays: [day],
          type: effectiveDays >= 4 ? 'perfect' : 'good',
          description: `Puente de ${effectiveDays} días consecutivos`,
        };
      }
    }
  }

  let start = day;
  let end = day;

  let current = addDays(day, -1);
  let expansionCount = 0;
  const MAX_EXPANSION = 30;

  while ((isWeekend(current) || holidaySet.has(getOptimizedDateKey(current))) && expansionCount < MAX_EXPANSION) {
    start = current;
    current = addDays(current, -1);
    expansionCount++;
  }

  current = addDays(day, 1);
  expansionCount = 0;

  while ((isWeekend(current) || holidaySet.has(getOptimizedDateKey(current))) && expansionCount < MAX_EXPANSION) {
    end = current;
    current = addDays(current, 1);
    expansionCount++;
  }

  const effectiveDays = differenceInDays(end, start) + 1;

  if (effectiveDays >= 3) {
    return {
      startDate: start,
      endDate: end,
      ptoDaysNeeded: 1,
      effectiveDays,
      efficiency: effectiveDays,
      ptoDays: [day],
      type: effectiveDays >= 4 ? 'perfect' : 'good',
      description: `Puente de ${effectiveDays} días consecutivos`,
    };
  }

  return null;
};

const findMultiDayBridgesOptimized = (
  freePeriods: Array<{ start: Date; end: Date; days: number }>,
  workdayIndex: Set<string>
): Bridge[] => {
  const bridges: Bridge[] = [];

  // Buscar gaps entre períodos libres
  for (let i = 0; i < freePeriods.length - 1; i++) {
    const period1 = freePeriods[i];
    const period2 = freePeriods[i + 1];

    const gapStart = addDays(period1.end, 1);
    const gapEnd = addDays(period2.start, -1);
    const gapDays = differenceInDays(gapEnd, gapStart) + 1;

    if (gapDays > 0 && gapDays <= 5) {
      // MAX_GAP_FOR_BRIDGE
      const ptoDays: Date[] = [];
      let current = new Date(gapStart);

      while (current <= gapEnd) {
        if (!isWeekend(current) && workdayIndex.has(getOptimizedDateKey(current))) {
          ptoDays.push(new Date(current));
        }
        current = addDays(current, 1);
      }

      if (ptoDays.length > 0 && ptoDays.length <= 3) {
        const totalEffectiveDays = differenceInDays(period2.end, period1.start) + 1;
        const efficiency = totalEffectiveDays / ptoDays.length;

        if (efficiency >= 3) {
          bridges.push({
            startDate: period1.start,
            endDate: period2.end,
            ptoDaysNeeded: ptoDays.length,
            effectiveDays: totalEffectiveDays,
            efficiency,
            ptoDays,
            type: efficiency >= 4 ? 'perfect' : efficiency >= 3 ? 'good' : 'acceptable',
            description: `Gap de ${ptoDays.length} día(s) entre períodos libres`,
          });
        }
      }
    }
  }

  return bridges;
};

const deduplicateAndSortBridges = (bridges: Bridge[]): Bridge[] => {
  const uniqueBridges = new Map<string, Bridge>();

  // O(n) - Deduplicar
  bridges.forEach((bridge) => {
    const key = bridge.ptoDays
      .map((d) => getOptimizedDateKey(d))
      .sort((a, b) => a.localeCompare(b))
      .join(',');

    const existing = uniqueBridges.get(key);
    if (!existing || bridge.efficiency > existing.efficiency) {
      uniqueBridges.set(key, bridge);
    }
  });

  return Array.from(uniqueBridges.values())
    .filter((b) => b.efficiency >= 3)
    .sort((a, b) => {
      const effDiff = b.efficiency - a.efficiency;
      if (Math.abs(effDiff) > 0.1) return effDiff;
      return b.effectiveDays - a.effectiveDays;
    });
};

import { addDays, differenceInDays, isWeekend } from 'date-fns';
import { PTO_CONSTANTS } from '../const';
import type { Bridge } from '../types';
import { getOptimizedDateKey } from './cache';
import { isFreeDay } from './helpers';

function analyzeSingleDayBridge(day: Date, holidaySet: Set<string>): Bridge | null {
  let start = day;
  let end = day;

  // ✅ AÑADIR LÍMITES DE SEGURIDAD
  let current = addDays(day, -1);
  let safetyCounter = 0;
  const MAX_ITERATIONS = PTO_CONSTANTS.SAFETY_LIMIT || 30;

  while (isFreeDay(current, holidaySet) && safetyCounter < MAX_ITERATIONS) {
    start = current;
    current = addDays(current, -1);
    safetyCounter++;
  }

  current = addDays(day, 1);
  safetyCounter = 0;

  while (isFreeDay(current, holidaySet) && safetyCounter < MAX_ITERATIONS) {
    end = current;
    current = addDays(current, 1);
    safetyCounter++;
  }

  const effectiveDays = differenceInDays(end, start) + 1;

  if (effectiveDays >= PTO_CONSTANTS.EFFICIENCY.MINIMUM_FOR_BRIDGE_CREATION) {
    return {
      startDate: start,
      endDate: end,
      ptoDaysNeeded: 1,
      effectiveDays,
      efficiency: effectiveDays,
      ptoDays: [day],
      type: effectiveDays >= PTO_CONSTANTS.EFFICIENCY.PERFECT ? 'perfect' : 'good',
      description: `Puente de ${effectiveDays} días consecutivos`,
    };
  }

  return null;
}

function findMultiDayBridges(availableWorkdays: Date[], holidaySet: Set<string>, workdaySet: Set<string>): Bridge[] {
  const bridges: Bridge[] = [];

  if (availableWorkdays.length === 0) return bridges;

  const freePeriods: Array<{ start: Date; end: Date }> = [];
  const startDate = availableWorkdays[0];
  const endDate = availableWorkdays[availableWorkdays.length - 1];

  let current = new Date(startDate);
  let periodStart: Date | null = null;

  while (current <= endDate) {
    if (isFreeDay(current, holidaySet)) {
      periodStart ??= new Date(current);
    } else if (periodStart) {
      freePeriods.push({
        start: periodStart,
        end: addDays(current, -1),
      });
      periodStart = null;
    }
    current = addDays(current, 1);
  }

  if (periodStart) {
    freePeriods.push({
      start: periodStart,
      end: new Date(current),
    });
  }

  for (let i = 0; i < freePeriods.length - 1; i++) {
    const period1 = freePeriods[i];
    const period2 = freePeriods[i + 1];

    const gapStart = addDays(period1.end, 1);
    const gapEnd = addDays(period2.start, -1);
    const gapDays = differenceInDays(gapEnd, gapStart) + 1;

    if (gapDays > 0 && gapDays <= PTO_CONSTANTS.MAX_GAP_FOR_BRIDGE) {
      const ptoDays: Date[] = [];
      let workdaysInGap = 0;

      let dayInGap = new Date(gapStart);
      while (dayInGap <= gapEnd) {
        if (!isWeekend(dayInGap) && workdaySet.has(getOptimizedDateKey(dayInGap))) {
          ptoDays.push(new Date(dayInGap));
          workdaysInGap++;
        }
        dayInGap = addDays(dayInGap, 1);
      }

      if (workdaysInGap > 0 && workdaysInGap <= 3) {
        const totalEffectiveDays = differenceInDays(period2.end, period1.start) + 1;
        const efficiency = totalEffectiveDays / workdaysInGap;

        if (efficiency >= PTO_CONSTANTS.EFFICIENCY.MINIMUM_FOR_BRIDGE_CREATION) {
          bridges.push({
            startDate: period1.start,
            endDate: period2.end,
            ptoDaysNeeded: workdaysInGap,
            effectiveDays: totalEffectiveDays,
            efficiency,
            ptoDays,
            type:
              efficiency >= PTO_CONSTANTS.EFFICIENCY.PERFECT
                ? 'perfect'
                : efficiency >= PTO_CONSTANTS.EFFICIENCY.GOOD
                  ? 'good'
                  : 'acceptable',
            description: `Gap de ${workdaysInGap} día(s) entre períodos libres`,
          });
        }
      }
    }
  }

  return bridges;
}

function deduplicateAndSortBridges(bridges: Bridge[], holidaySet: Set<string>): Bridge[] {
  const uniqueBridges = new Map<string, Bridge>();

  for (const bridge of bridges) {
    const key = bridge.ptoDays
      .map((d) => getOptimizedDateKey(d))
      .sort((a, b) => a.localeCompare(b))
      .join(',');
    const existing = uniqueBridges.get(key);

    if (!existing || bridge.efficiency > existing.efficiency) {
      uniqueBridges.set(key, bridge);
    }
  }

  return Array.from(uniqueBridges.values())
    .filter((b) => b.efficiency >= PTO_CONSTANTS.EFFICIENCY.MINIMUM_FOR_BRIDGE_CREATION)
    .sort((a, b) => {
      if (Math.abs(b.efficiency - a.efficiency) > PTO_CONSTANTS.BRIDGE_GENERATION.EFFICIENCY_COMPARISON_THRESHOLD) {
        return b.efficiency - a.efficiency;
      }
      if (b.effectiveDays !== a.effectiveDays) {
        return b.effectiveDays - a.effectiveDays;
      }
      const aHolidayConnections = countHolidayConnections(a, holidaySet);
      const bHolidayConnections = countHolidayConnections(b, holidaySet);
      return bHolidayConnections - aHolidayConnections;
    });
}

function countHolidayConnections(bridge: Bridge, holidaySet: Set<string>): number {
  let connections = 0;
  let current = new Date(bridge.startDate);

  while (current <= bridge.endDate) {
    if (holidaySet.has(getOptimizedDateKey(current))) {
      connections++;
    }
    current = addDays(current, 1);
  }

  return connections;
}

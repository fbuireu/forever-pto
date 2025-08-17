import { HolidayDTO } from '@application/dto/holiday/types';
import { getDateKey } from '@application/stores/utils/helpers';
import { addDays, differenceInDays, isWeekend } from 'date-fns';
import { PTO_CONSTANTS } from '../../const';
import { Bridge, Suggestion } from '../../types';
import { getCombinationKey } from '../../utils/helpers';

export function selectAlternativeBridges(
  bridges: Bridge[],
  targetPtoDays: number,
  usedCombinations: Set<string>
): Suggestion {
  const selectedDays: Date[] = [];
  const selectedBridges: Bridge[] = [];
  const usedDates = new Set<string>();
  let totalPtoDays = 0;
  let totalEffectiveDays = 0;

  for (const bridge of bridges) {
    if (totalPtoDays >= targetPtoDays) break;

    const hasConflict = bridge.ptoDays.some((day) => usedDates.has(getDateKey(day)));

    if (!hasConflict && totalPtoDays + bridge.ptoDaysNeeded <= targetPtoDays) {
      selectedBridges.push(bridge);
      bridge.ptoDays.forEach((day) => {
        selectedDays.push(day);
        usedDates.add(getDateKey(day));
      });
      totalPtoDays += bridge.ptoDaysNeeded;
      totalEffectiveDays += bridge.effectiveDays;
    }
  }

  if (selectedDays.length < targetPtoDays) {
    const remainingDays = targetPtoDays - selectedDays.length;

    const valuableDays = bridges
      .filter(
        (b) => b.ptoDaysNeeded === 1 && b.efficiency >= PTO_CONSTANTS.BRIDGE_GENERATION.MIN_EFFICIENCY_FOR_ALTERNATIVES
      )
      .filter((b) => !usedDates.has(getDateKey(b.ptoDays[0])))
      .slice(0, remainingDays);

    for (const bridge of valuableDays) {
      if (selectedDays.length >= targetPtoDays) break;
      selectedDays.push(bridge.ptoDays[0]);
      totalEffectiveDays += bridge.effectiveDays;
      selectedBridges.push(bridge);
    }
  }

  return {
    days: selectedDays.toSorted((a, b) => a.getTime() - b.getTime()),
    totalEffectiveDays,
    efficiency: selectedDays.length > 0 ? totalEffectiveDays / selectedDays.length : 0,
    bridges: selectedBridges,
  };
}

export function combineMonthlyBridges(
  month1Bridges: Bridge[],
  month2Bridges: Bridge[],
  targetDays: number
): Suggestion {
  const selectedDays: Date[] = [];
  let totalEffectiveDays = 0;

  const halfTarget = Math.floor(targetDays / 2);

  let taken = 0;
  for (const bridge of month1Bridges) {
    if (taken + bridge.ptoDaysNeeded <= halfTarget) {
      selectedDays.push(...bridge.ptoDays);
      totalEffectiveDays += bridge.effectiveDays;
      taken += bridge.ptoDaysNeeded;
    }
  }

  const remaining = targetDays - taken;
  taken = 0;
  for (const bridge of month2Bridges) {
    if (taken + bridge.ptoDaysNeeded <= remaining) {
      selectedDays.push(...bridge.ptoDays);
      totalEffectiveDays += bridge.effectiveDays;
      taken += bridge.ptoDaysNeeded;
    }
  }

  return {
    days: selectedDays.toSorted((a, b) => a.getTime() - b.getTime()),
    totalEffectiveDays,
    efficiency: selectedDays.length > 0 ? totalEffectiveDays / selectedDays.length : 0,
  };
}

export function findSimilarSizeBlocks(
  bridges: any[],
  targetSize: number,
  existingDaySet: Set<string>,
  usedCombinations: Set<string>
): Suggestion[] {
  const alternatives: Suggestion[] = [];

  const blockCombinations: Date[][] = [];

  for (
    let i = 0;
    i < bridges.length && blockCombinations.length < PTO_CONSTANTS.BRIDGE_GENERATION.MAX_BLOCK_COMBINATIONS;
    i++
  ) {
    const block: Date[] = [];
    let currentSize = 0;

    for (let j = i; j < bridges.length && currentSize < targetSize; j++) {
      const bridge = bridges[j];

      const hasConflict = bridge.ptoDays.some((day: Date) => existingDaySet.has(getDateKey(day)));

      if (!hasConflict && currentSize + bridge.ptoDaysNeeded <= targetSize) {
        block.push(...bridge.ptoDays);
        currentSize += bridge.ptoDaysNeeded;

        if (currentSize === targetSize) {
          blockCombinations.push([...block]);
          break;
        }
      }
    }
  }

  for (const block of blockCombinations) {
    const key = getCombinationKey(block);
    if (!usedCombinations.has(key)) {
      const totalEffectiveDays = calculateGroupedEffectiveDays(block, bridges[0].holidays || []);
      const efficiency = totalEffectiveDays / block.length;

      if (efficiency >= PTO_CONSTANTS.BRIDGE_GENERATION.MIN_EFFICIENCY_FOR_ALTERNATIVES) {
        alternatives.push({
          days: block.toSorted((a, b) => a.getTime() - b.getTime()),
          totalEffectiveDays,
          efficiency,
          strategy: 'grouped',
        });
        usedCombinations.add(key);
      }
    }
  }

  return alternatives;
}

export function calculateGroupedEffectiveDays(days: Date[], holidays: HolidayDTO[]): number {
  if (days.length === 0) return 0;

  const sortedDays = [...days].sort((a, b) => a.getTime() - b.getTime());
  const holidaySet = new Set(holidays.map((h) => getDateKey(new Date(h.date))));

  let totalEffectiveDays = 0;
  let currentGroup: Date[] = [];

  for (let i = 0; i < sortedDays.length; i++) {
    const currentDay = sortedDays[i];

    if (currentGroup.length === 0) {
      currentGroup = [currentDay];
    } else {
      const lastDay = currentGroup[currentGroup.length - 1];
      const daysDiff = differenceInDays(currentDay, lastDay);

      if (daysDiff <= PTO_CONSTANTS.DAY_GROUPING.MAX_DAYS_DIFF) {
        currentGroup.push(currentDay);
      } else {
        totalEffectiveDays += calculateGroupEffectiveDays(currentGroup, holidaySet);
        currentGroup = [currentDay];
      }
    }
  }

  if (currentGroup.length > 0) {
    totalEffectiveDays += calculateGroupEffectiveDays(currentGroup, holidaySet);
  }

  return totalEffectiveDays;
}

function calculateGroupEffectiveDays(group: Date[], holidaySet: Set<string>): number {
  if (group.length === 0) return 0;

  let start = group[0];
  let end = group[group.length - 1];

  let current = addDays(start, -1);
  let safetyCounter = 0;
  while ((isWeekend(current) || holidaySet.has(getDateKey(current))) && safetyCounter < PTO_CONSTANTS.SAFETY_LIMIT) {
    start = current;
    current = addDays(current, -1);
    safetyCounter++;
  }

  current = addDays(end, 1);
  safetyCounter = 0;
  while ((isWeekend(current) || holidaySet.has(getDateKey(current))) && safetyCounter < PTO_CONSTANTS.SAFETY_LIMIT) {
    end = current;
    current = addDays(current, 1);
    safetyCounter++;
  }

  return differenceInDays(end, start) + 1;
}

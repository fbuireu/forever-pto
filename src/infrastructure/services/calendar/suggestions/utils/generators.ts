import type { HolidayDTO } from '@application/dto/holiday/types';
import { getDateKey } from '@application/stores/utils/helpers';
import { PTO_CONSTANTS } from '../../const';
import { Bridge, OptimizationStrategy } from '../../types';
import { findAdjacentWorkday, selectOptimalBridges } from './helpers';

export function selectDaysByStrategy(
  bridges: Bridge[],
  ptoDays: number,
  strategy: OptimizationStrategy,
  availableWorkdays: Date[],
  holidays: HolidayDTO[]
): Date[] {
  switch (strategy) {
    case 'grouped':
      return selectGroupedDays(bridges, ptoDays, availableWorkdays, holidays);
    case 'optimized':
      return selectOptimizedDays(bridges, ptoDays);
    case 'balanced':
      return selectBalancedDays(bridges, ptoDays);
    default:
      return selectGroupedDays(bridges, ptoDays, availableWorkdays, holidays);
  }
}

export function selectGroupedDays(
  bridges: Bridge[],
  ptoDays: number,
  availableWorkdays: Date[],
  holidays: HolidayDTO[]
): Date[] {
  const selectedDays: Date[] = [];
  const usedDates = new Set<string>();

  const largestViableBridge = bridges
    .filter((b) => b.ptoDaysNeeded <= ptoDays)
    .sort((a, b) => b.ptoDaysNeeded - a.ptoDaysNeeded)[0];

  if (largestViableBridge) {
    selectedDays.push(...largestViableBridge.ptoDays);
    largestViableBridge.ptoDays.forEach((d) => usedDates.add(getDateKey(d)));
  }

  while (selectedDays.length < ptoDays) {
    const expansionDay = findAdjacentWorkday(selectedDays, availableWorkdays, usedDates);

    if (expansionDay) {
      selectedDays.push(expansionDay);
      usedDates.add(getDateKey(expansionDay));
    } else {
      break;
    }
  }

  return selectedDays.sort((a, b) => a.getTime() - b.getTime());
}

export function selectOptimizedDays(bridges: Bridge[], ptoDays: number): Date[] {
  const selectedBridges = selectOptimalBridges(bridges, ptoDays);
  const selectedDays: Date[] = [];

  for (const bridge of selectedBridges) {
    selectedDays.push(...bridge.ptoDays);
  }

  return selectedDays;
}

function selectBalancedDays(bridges: Bridge[], ptoDays: number): Date[] {
  const selectedDays: Date[] = [];
  const usedDates = new Set<string>();

  const mediumBridges = bridges.filter(
    (b) =>
      b.ptoDaysNeeded >= 2 &&
      b.ptoDaysNeeded <= 3 &&
      b.efficiency >= PTO_CONSTANTS.BRIDGE_GENERATION.MIN_EFFICIENCY_FOR_MEDIUM
  );

  for (const bridge of mediumBridges) {
    if (selectedDays.length + bridge.ptoDaysNeeded <= ptoDays) {
      const hasConflict = bridge.ptoDays.some((d) => usedDates.has(getDateKey(d)));

      if (!hasConflict) {
        selectedDays.push(...bridge.ptoDays);
        bridge.ptoDays.forEach((d) => usedDates.add(getDateKey(d)));
      }
    }
  }

  const singleDayBridges = bridges.filter(
    (b) => b.ptoDaysNeeded === 1 && b.efficiency >= PTO_CONSTANTS.BRIDGE_GENERATION.MIN_EFFICIENCY_FOR_SINGLE
  );

  for (const bridge of singleDayBridges) {
    if (selectedDays.length >= ptoDays) break;

    if (!usedDates.has(getDateKey(bridge.ptoDays[0]))) {
      selectedDays.push(bridge.ptoDays[0]);
      usedDates.add(getDateKey(bridge.ptoDays[0]));
    }
  }

  return selectedDays.sort((a, b) => a.getTime() - b.getTime());
}

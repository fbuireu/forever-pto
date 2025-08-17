import { Bridge } from '../types';
import { getOptimizedDateKey } from './cache';
import { deduplicateDays } from './helpers';

export const selectOptimalDaysFromBridges = (
  bridges: Bridge[],
  targetPtoDays: number
): { days: Date[]; totalEffectiveDays: number; bridges: Bridge[] } => {
  const selectedBridges: Bridge[] = [];
  const usedDates = new Set<string>();
  let totalPtoDays = 0;
  let totalEffectiveDays = 0;

  for (const bridge of bridges) {
    if (totalPtoDays >= targetPtoDays) break;

    const hasConflict = bridge.ptoDays.some((day) => usedDates.has(getOptimizedDateKey(day)));

    if (!hasConflict && totalPtoDays + bridge.ptoDaysNeeded <= targetPtoDays) {
      selectedBridges.push(bridge);
      bridge.ptoDays.forEach((day) => {
        usedDates.add(getOptimizedDateKey(day));
      });
      totalPtoDays += bridge.ptoDaysNeeded;
      totalEffectiveDays += bridge.effectiveDays;
    }
  }

  const selectedDays: Date[] = [];
  selectedBridges.forEach((bridge) => {
    selectedDays.push(...bridge.ptoDays);
  });

  return {
    days: deduplicateDays(selectedDays),
    totalEffectiveDays,
    bridges: selectedBridges,
  };
};

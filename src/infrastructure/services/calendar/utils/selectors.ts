import { Bridge } from '../types';
import { getKey } from './cache';

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

    const hasConflict = bridge.ptoDays.some((day) => usedDates.has(getKey(day)));

    if (!hasConflict && totalPtoDays + bridge.ptoDaysNeeded <= targetPtoDays) {
      selectedBridges.push(bridge);
      bridge.ptoDays.forEach((day) => usedDates.add(getKey(day)));
      totalPtoDays += bridge.ptoDaysNeeded;
      totalEffectiveDays += bridge.effectiveDays;
    }
  }

  if (totalPtoDays < targetPtoDays) {
    const singleDayBridges = bridges.filter((b) => b.ptoDaysNeeded === 1 && !usedDates.has(getKey(b.ptoDays[0])));

    for (const bridge of singleDayBridges) {
      if (totalPtoDays >= targetPtoDays) break;

      selectedBridges.push(bridge);
      usedDates.add(getKey(bridge.ptoDays[0]));
      totalPtoDays++;
      totalEffectiveDays += bridge.effectiveDays;
    }
  }

  const selectedDays = selectedBridges.flatMap((bridge) => bridge.ptoDays);

  return {
    days: selectedDays.sort((a, b) => a.getTime() - b.getTime()),
    totalEffectiveDays,
    bridges: selectedBridges,
  };
};

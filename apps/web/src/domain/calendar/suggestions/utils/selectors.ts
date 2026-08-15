import { PTO_CONSTANTS } from '@domain/calendar/const';
import type { Bridge } from '@domain/calendar/types';
import { FilterStrategy } from '@domain/calendar/types';
import { getKey } from '@domain/calendar/utils/cache';

interface SelectOptimalDaysBase {
  bridges: Bridge[];
  targetPtoDays: number;
  presorted?: boolean;
}

interface SelectOptimalCombinationParams {
  bridges: Bridge[];
  targetPtoDays: number;
}

function canSelectBridge(bridge: Bridge, usedDates: Set<string>, total: number, target: number): boolean {
  return total + bridge.ptoDaysNeeded <= target && !bridge.ptoDays.some((day) => usedDates.has(getKey(day)));
}

function selectFromCandidates(
  candidates: Bridge[],
  selected: Bridge[],
  usedDates: Set<string>,
  total: number,
  target: number
): number {
  for (const bridge of candidates) {
    if (total >= target) break;
    if (!canSelectBridge(bridge, usedDates, total, target)) continue;
    selected.push(bridge);
    for (const day of bridge.ptoDays) usedDates.add(getKey(day));
    total += bridge.ptoDaysNeeded;
  }
  return total;
}

function selectOptimalCombination({ bridges, targetPtoDays }: SelectOptimalCombinationParams) {
  const {
    EFFICIENCY: { ACCEPTABLE },
    SELECTION_WEIGHTS: { HIGH_VALUE_THRESHOLD_EFFECTIVE, HIGH_VALUE_THRESHOLD_DAYS },
  } = PTO_CONSTANTS;

  const isHighValue = (b: Bridge) =>
    b.ptoDaysNeeded >= HIGH_VALUE_THRESHOLD_DAYS &&
    b.effectiveDays >= HIGH_VALUE_THRESHOLD_EFFECTIVE &&
    b.efficiency >= ACCEPTABLE;

  const selected: Bridge[] = [];
  const usedDates = new Set<string>();

  const highValueBridges = bridges.filter(isHighValue);
  const total = selectFromCandidates(highValueBridges, selected, usedDates, 0, targetPtoDays);

  if (total < targetPtoDays) {
    const highValueSet = new Set(highValueBridges);
    selectFromCandidates(
      bridges.filter((b) => !highValueSet.has(b)),
      selected,
      usedDates,
      total,
      targetPtoDays
    );
  }

  return selected;
}

const sortByScore = (bridges: Bridge[]) => {
  const {
    SCORING: { BASE_SCORE, MULTI_DAY_BONUS, EFFICIENCY, TOTAL_VALUE },
    SELECTION_WEIGHTS: { HIGH_VALUE_THRESHOLD_EFFECTIVE, HIGH_VALUE_THRESHOLD_DAYS },
  } = PTO_CONSTANTS;
  const scoredBridges = bridges.map((bridge) => {
    const efficiencyScore = bridge.efficiency;
    const valueScore = bridge.effectiveDays / 10;

    const multiDayBonus =
      bridge.ptoDaysNeeded >= HIGH_VALUE_THRESHOLD_DAYS && bridge.effectiveDays >= HIGH_VALUE_THRESHOLD_EFFECTIVE
        ? MULTI_DAY_BONUS
        : BASE_SCORE;

    const totalScore = (efficiencyScore * EFFICIENCY + valueScore * TOTAL_VALUE) * multiDayBonus;

    return {
      ...bridge,
      score: totalScore,
    };
  });

  scoredBridges.sort((a, b) => b.score - a.score);

  return scoredBridges;
};

export const selectOptimalDaysFromBridges = ({ bridges, targetPtoDays, presorted = false }: SelectOptimalDaysBase) => {
  const orderedBridges = presorted ? bridges : sortByScore(bridges);

  const selectedBridges = selectOptimalCombination({ bridges: orderedBridges, targetPtoDays });

  const selectedDays = selectedBridges.flatMap((bridge) => bridge.ptoDays);

  return {
    days: selectedDays.toSorted((a, b) => a.getTime() - b.getTime()),
    bridges: selectedBridges,
  };
};

interface SelectBridgesForStrategy extends SelectOptimalDaysBase {
  strategy: FilterStrategy;
}

const compareGrouped = (a: Bridge, b: Bridge) => {
  if (a.ptoDaysNeeded !== b.ptoDaysNeeded) {
    return b.ptoDaysNeeded - a.ptoDaysNeeded;
  }
  return b.efficiency - a.efficiency;
};

const compareOptimized = (a: Bridge, b: Bridge) => {
  const effDiff = b.efficiency - a.efficiency;
  if (Math.abs(effDiff) > PTO_CONSTANTS.BRIDGE_GENERATION.EFFICIENCY_COMPARISON_THRESHOLD) {
    return effDiff;
  }
  return b.effectiveDays - a.effectiveDays;
};

export const selectBridgesForStrategy = ({
  bridges,
  targetPtoDays,
  strategy,
  presorted = false,
}: SelectBridgesForStrategy) => {
  let sortedBridges: Bridge[];

  switch (strategy) {
    case FilterStrategy.GROUPED:
      sortedBridges = presorted ? bridges : bridges.toSorted(compareGrouped);
      break;

    case FilterStrategy.OPTIMIZED:
      sortedBridges = presorted ? bridges : bridges.toSorted(compareOptimized);
      break;
    default:
      return selectOptimalDaysFromBridges({ bridges, targetPtoDays, presorted });
  }

  const selectedBridges: Bridge[] = [];
  const usedDates = new Set<string>();
  let totalPtoDays = 0;

  for (const bridge of sortedBridges) {
    if (totalPtoDays >= targetPtoDays) break;

    const hasConflict = bridge.ptoDays.some((day) => usedDates.has(getKey(day)));

    if (!hasConflict && totalPtoDays + bridge.ptoDaysNeeded <= targetPtoDays) {
      selectedBridges.push(bridge);
      bridge.ptoDays.forEach((day) => {
        usedDates.add(getKey(day));
      });
      totalPtoDays += bridge.ptoDaysNeeded;
    }
  }

  const selectedDays = selectedBridges.flatMap((bridge) => bridge.ptoDays);

  return {
    days: selectedDays.toSorted((a, b) => a.getTime() - b.getTime()),
    bridges: selectedBridges,
  };
};

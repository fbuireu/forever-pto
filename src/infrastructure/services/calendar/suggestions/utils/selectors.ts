import { PTO_CONSTANTS } from '../../const';
import { Bridge, FilterStrategy } from '../../types';
import { getKey } from '../../utils/cache';

interface SelectOptimalDaysBase {
  bridges: Bridge[];
  targetPtoDays: number;
}

interface SelectOptimalDaysBaseReturn {
  days: Date[];
  totalEffectiveDays: number;
  bridges: Bridge[];
}

export const selectOptimalDaysFromBridges = ({
  bridges,
  targetPtoDays,
}: SelectOptimalDaysBase): SelectOptimalDaysBaseReturn => {
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

  const selectedBridges = selectOptimalCombination({ bridges: scoredBridges, targetPtoDays });

  const selectedDays = selectedBridges.flatMap((bridge) => bridge.ptoDays);
  const totalEffectiveDays = selectedBridges.reduce((sum, b) => sum + b.effectiveDays, 0);

  return {
    days: selectedDays.toSorted((a, b) => a.getTime() - b.getTime()),
    totalEffectiveDays,
    bridges: selectedBridges,
  };
};

interface SelectOptimalCombinationParams extends SelectOptimalDaysBase {
  bridges: (Bridge & { score: number })[];
}

function selectOptimalCombination({ bridges, targetPtoDays }: SelectOptimalCombinationParams): Bridge[] {
  const {
    EFFICIENCY: { ACCEPTABLE },
    SELECTION_WEIGHTS: { HIGH_VALUE_THRESHOLD_EFFECTIVE, HIGH_VALUE_THRESHOLD_DAYS },
  } = PTO_CONSTANTS;
  const selectedBridges: Bridge[] = [];
  const usedDates = new Set<string>();
  let totalPtoDays = 0;

  const highValueBridges = bridges.filter(
    (b) =>
      b.ptoDaysNeeded >= HIGH_VALUE_THRESHOLD_DAYS &&
      b.effectiveDays >= HIGH_VALUE_THRESHOLD_EFFECTIVE &&
      b.efficiency >= ACCEPTABLE
  );

  for (const bridge of highValueBridges) {
    if (totalPtoDays + bridge.ptoDaysNeeded > targetPtoDays) continue;

    const hasConflict = bridge.ptoDays.some((day) => usedDates.has(getKey(day)));

    if (!hasConflict) {
      selectedBridges.push(bridge);
      bridge.ptoDays.forEach((day) => usedDates.add(getKey(day)));
      totalPtoDays += bridge.ptoDaysNeeded;

      if (totalPtoDays >= targetPtoDays) break;
    }
  }

  if (totalPtoDays < targetPtoDays) {
    const remainingBridges = bridges.filter((b) => !highValueBridges.includes(b));

    for (const bridge of remainingBridges) {
      if (totalPtoDays >= targetPtoDays) break;

      const hasConflict = bridge.ptoDays.some((day) => usedDates.has(getKey(day)));

      if (!hasConflict && totalPtoDays + bridge.ptoDaysNeeded <= targetPtoDays) {
        selectedBridges.push(bridge);
        bridge.ptoDays.forEach((day) => usedDates.add(getKey(day)));
        totalPtoDays += bridge.ptoDaysNeeded;
      }
    }
  }

  if (totalPtoDays < targetPtoDays) {
    const singleDayBridges = bridges.filter((b) => b.ptoDaysNeeded === 1 && !usedDates.has(getKey(b.ptoDays[0])));

    for (const bridge of singleDayBridges) {
      if (totalPtoDays >= targetPtoDays) break;

      selectedBridges.push(bridge);
      usedDates.add(getKey(bridge.ptoDays[0]));
      totalPtoDays++;
    }
  }

  return selectedBridges;
}

interface SelectBridgesForStrategy {
  bridges: Bridge[];
  targetPtoDays: number;
  strategy: FilterStrategy;
}

export const selectBridgesForStrategy = ({
  bridges,
  targetPtoDays,
  strategy,
}: SelectBridgesForStrategy): SelectOptimalDaysBaseReturn => {
  let sortedBridges: Bridge[];

  switch (strategy) {
    case FilterStrategy.GROUPED:
      sortedBridges = [...bridges].sort((a, b) => {
        if (a.ptoDaysNeeded !== b.ptoDaysNeeded) {
          return b.ptoDaysNeeded - a.ptoDaysNeeded;
        }
        return b.efficiency - a.efficiency;
      });
      break;

    case FilterStrategy.OPTIMIZED:
      sortedBridges = [...bridges].sort((a, b) => {
        const effDiff = b.efficiency - a.efficiency;
        if (Math.abs(effDiff) > PTO_CONSTANTS.BRIDGE_GENERATION.EFFICIENCY_COMPARISON_THRESHOLD) {
          return effDiff;
        }
        return b.effectiveDays - a.effectiveDays;
      });
      break;

    case FilterStrategy.BALANCED:
    default:
      return selectOptimalDaysFromBridges({ bridges, targetPtoDays });
  }

  const selectedBridges: Bridge[] = [];
  const usedDates = new Set<string>();
  let totalPtoDays = 0;
  let totalEffectiveDays = 0;

  for (const bridge of sortedBridges) {
    if (totalPtoDays >= targetPtoDays) break;

    const hasConflict = bridge.ptoDays.some((day) => usedDates.has(getKey(day)));

    if (!hasConflict && totalPtoDays + bridge.ptoDaysNeeded <= targetPtoDays) {
      selectedBridges.push(bridge);
      bridge.ptoDays.forEach((day) => usedDates.add(getKey(day)));
      totalPtoDays += bridge.ptoDaysNeeded;
      totalEffectiveDays += bridge.effectiveDays;
    }
  }

  const selectedDays = selectedBridges.flatMap((bridge) => bridge.ptoDays);

  return {
    days: selectedDays.toSorted((a, b) => a.getTime() - b.getTime()),
    totalEffectiveDays,
    bridges: selectedBridges,
  };
};

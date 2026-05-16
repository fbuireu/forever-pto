import { PTO_CONSTANTS } from '@domain/calendar/const';
import type { Bridge } from '@domain/calendar/types';
import { FilterStrategy } from '@domain/calendar/types';
import { getKey } from '@domain/calendar/utils/cache';

interface SelectOptimalDaysBase {
  bridges: Bridge[];
  targetPtoDays: number;
}

interface SelectOptimalCombinationParams extends SelectOptimalDaysBase {
  bridges: (Bridge & { score: number })[];
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

// Two-pass greedy selection:
// Pass 1 — fill with "high value" bridges first (multi-day, high span, acceptable efficiency).
// Pass 2 — fill remaining PTO budget with whatever non-conflicting bridges are left.
// This prevents many small single-day bridges from crowding out long high-value blocks.
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
  let total = selectFromCandidates(highValueBridges, selected, usedDates, 0, targetPtoDays);

  if (total < targetPtoDays) {
    const highValueSet = new Set(highValueBridges);
    total = selectFromCandidates(
      bridges.filter((b) => !highValueSet.has(b)),
      selected,
      usedDates,
      total,
      targetPtoDays
    );
  }

  if (total < targetPtoDays) {
    selectFromCandidates(
      bridges.filter((b) => b.ptoDaysNeeded === 1),
      selected,
      usedDates,
      total,
      targetPtoDays
    );
  }

  return selected;
}

export const selectOptimalDaysFromBridges = ({ bridges, targetPtoDays }: SelectOptimalDaysBase) => {
  const {
    SCORING: { BASE_SCORE, MULTI_DAY_BONUS, EFFICIENCY, TOTAL_VALUE },
    SELECTION_WEIGHTS: { HIGH_VALUE_THRESHOLD_EFFECTIVE, HIGH_VALUE_THRESHOLD_DAYS },
  } = PTO_CONSTANTS;
  const scoredBridges = bridges.map((bridge) => {
    const efficiencyScore = bridge.efficiency;
    const valueScore = bridge.effectiveDays / 10; // normalise absolute span to a comparable scale

    // High-value bridges (long + efficient) get a score multiplier so they outrank
    // many small single-day bridges that would otherwise accumulate a similar raw score.
    const multiDayBonus =
      bridge.ptoDaysNeeded >= HIGH_VALUE_THRESHOLD_DAYS && bridge.effectiveDays >= HIGH_VALUE_THRESHOLD_EFFECTIVE
        ? MULTI_DAY_BONUS
        : BASE_SCORE;

    // score = (efficiency * 0.6 + normalised_span * 0.4) * bonus
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

interface SelectBridgesForStrategy {
  bridges: Bridge[];
  targetPtoDays: number;
  strategy: FilterStrategy;
}

export const selectBridgesForStrategy = ({ bridges, targetPtoDays, strategy }: SelectBridgesForStrategy) => {
  let sortedBridges: Bridge[];

  switch (strategy) {
    case FilterStrategy.GROUPED:
      sortedBridges = bridges.toSorted((a, b) => {
        if (a.ptoDaysNeeded !== b.ptoDaysNeeded) {
          return b.ptoDaysNeeded - a.ptoDaysNeeded;
        }
        return b.efficiency - a.efficiency;
      });
      break;

    case FilterStrategy.OPTIMIZED:
      sortedBridges = bridges.toSorted((a, b) => {
        const effDiff = b.efficiency - a.efficiency;
        if (Math.abs(effDiff) > PTO_CONSTANTS.BRIDGE_GENERATION.EFFICIENCY_COMPARISON_THRESHOLD) {
          return effDiff;
        }
        return b.effectiveDays - a.effectiveDays;
      });
      break;
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
      bridge.ptoDays.forEach((day) => {
        usedDates.add(getKey(day));
      });
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

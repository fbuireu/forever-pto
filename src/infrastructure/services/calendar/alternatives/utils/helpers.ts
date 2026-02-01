import { PTO_CONSTANTS } from '../../const';
import type { Bridge, Suggestion } from '../../types';
import { getCombinationKey, getKey } from '../../utils/cache';

function generateGreedyAlternatives(
  bridges: Bridge[],
  targetDays: number,
  minEfficiency: number,
  maxResults: number
): Suggestion[] {
  const results: Suggestion[] = [];
  const usedCombinations = new Set<string>();
  const SORTING_STRATEGIES = [
    (a: Bridge, b: Bridge) => b.efficiency - a.efficiency,
    (a: Bridge, b: Bridge) => b.effectiveDays - a.effectiveDays,
    (a: Bridge, b: Bridge) => b.ptoDaysNeeded - a.ptoDaysNeeded,
    (a: Bridge, b: Bridge) => b.efficiency * b.ptoDaysNeeded - a.efficiency * a.ptoDaysNeeded,
  ];

  for (
    let strategyIndex = 0;
    strategyIndex < SORTING_STRATEGIES.length && results.length < maxResults;
    strategyIndex++
  ) {
    const sortedBridges = [...bridges].sort(SORTING_STRATEGIES[strategyIndex]);

    const selected: Bridge[] = [];
    const usedDates = new Set<string>();
    let remainingDays = targetDays;

    for (const bridge of sortedBridges) {
      if (remainingDays <= 0) break;
      if (bridge.ptoDaysNeeded > remainingDays) continue;
      if (bridge.efficiency < minEfficiency) continue;

      const hasConflict = bridge.ptoDays.some((day) => usedDates.has(getKey(day)));
      if (hasConflict) continue;

      selected.push(bridge);
      bridge.ptoDays.forEach((day) => usedDates.add(getKey(day)));
      remainingDays -= bridge.ptoDaysNeeded;
    }

    if (selected.length > 0) {
      const days = selected.flatMap((b) => b.ptoDays);

      const combinationKey = getCombinationKey(days);
      if (!usedCombinations.has(combinationKey)) {
        results.push({
          days: days.toSorted((a, b) => a.getTime() - b.getTime()),
          bridges: selected,
        });
        usedCombinations.add(combinationKey);
      }
    }
  }

  return results;
}

interface FindAlternativeCombinationsParams {
  bridges: Bridge[];
  ptoDays: number;
  existingSuggestionSet: Set<number>;
  maxAlternatives: number;
  minEfficiency: number;
}

export function findAlternativeCombinations({
  bridges,
  ptoDays,
  existingSuggestionSet,
  maxAlternatives,
  minEfficiency,
}: FindAlternativeCombinationsParams): Suggestion[] {
  const { EFFICIENCY_COMPARISON_THRESHOLD } = PTO_CONSTANTS.BRIDGE_GENERATION;

  const availableBridges = bridges.filter(
    (bridge) => !bridge.ptoDays.some((day) => existingSuggestionSet.has(day.getTime()))
  );

  const alternatives = generateGreedyAlternatives(availableBridges, ptoDays, minEfficiency, maxAlternatives);

  const getAverageEfficiency = (suggestion: Suggestion): number => {
    if (!suggestion.bridges || suggestion.bridges.length === 0) return 0;
    const totalEfficiency = suggestion.bridges.reduce((sum, b) => sum + b.efficiency, 0);
    return totalEfficiency / suggestion.bridges.length;
  };

  const getTotalEffectiveDays = (suggestion: Suggestion): number => {
    if (!suggestion.bridges) return 0;
    return suggestion.bridges.reduce((sum, b) => sum + b.effectiveDays, 0);
  };

  return alternatives
    .toSorted((a, b) => {
      const effDiff = getAverageEfficiency(b) - getAverageEfficiency(a);
      return Math.abs(effDiff) > EFFICIENCY_COMPARISON_THRESHOLD
        ? effDiff
        : getTotalEffectiveDays(b) - getTotalEffectiveDays(a);
    })
    .slice(0, maxAlternatives);
}

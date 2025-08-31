import { PTO_CONSTANTS } from '../../const';
import type { Bridge, Suggestion } from '../../types';
import { getCombinationKey, getKey } from '../../utils/cache';

function generateCombinationsWithBacktracking(
  bridges: Bridge[],
  targetDays: number,
  minEfficiency: number,
  maxResults: number,
  maxDepth: number
): Suggestion[] {
  const results: Suggestion[] = [];
  const visitedStates = new Set<string>();

  function backtrack(index: number, selected: Bridge[], remainingDays: number, usedDates: Set<string>, depth: number) {
    const stateKey = `${index}-${remainingDays}-${Array.from(usedDates)
      .toSorted((a, b) => a.localeCompare(b))
      .join(',')}`;

    if (visitedStates.has(stateKey)) return;
    visitedStates.add(stateKey);

    if (remainingDays === 0) {
      const days = selected.flatMap((b) => b.ptoDays);
      const totalEffective = selected.reduce((sum, b) => sum + b.effectiveDays, 0);
      const efficiency = totalEffective / days.length;

      if (efficiency >= minEfficiency) {
        results.push({
          days: days.toSorted((a, b) => a.getTime() - b.getTime()),
          totalEffectiveDays: totalEffective,
          efficiency,
          bridges: selected,
        });
      }
      return;
    }

    if (results.length >= maxResults || depth > maxDepth || index >= bridges.length) {
      return;
    }

    for (let i = index; i < bridges.length; i++) {
      const bridge = bridges[i];

      if (bridge.ptoDaysNeeded <= remainingDays) {
        const hasConflict = bridge.ptoDays.some((day) => usedDates.has(getKey(day)));

        if (!hasConflict) {
          const newUsedDates = new Set(usedDates);
          bridge.ptoDays.forEach((day) => newUsedDates.add(getKey(day)));

          backtrack(i + 1, [...selected, bridge], remainingDays - bridge.ptoDaysNeeded, newUsedDates, depth + 1);
        }
      }
    }
  }

  backtrack(0, [], targetDays, new Set(), 0);
  return results;
}

function diversifyCombinations(combinations: Suggestion[], targetCount: number): Suggestion[] {
  if (combinations.length <= targetCount) return combinations;

  const grouped = new Map<string, Suggestion[]>();

  combinations.forEach((combo) => {
    const months = combo.days.map((d) => d.getMonth());
    const uniqueMonths = new Set(months);
    const spread = uniqueMonths.size;
    const groupKey = `${spread}-${Math.floor(combo.efficiency ?? 0)}`;
    if (!grouped.has(groupKey)) {
      grouped.set(groupKey, []);
    }
    grouped.get(groupKey)!.push(combo);
  });

  const result: Suggestion[] = [];
  const perGroup = Math.ceil(targetCount / grouped.size);

  for (const [_, group] of grouped) {
    result.push(...group.slice(0, perGroup));
  }

  return result.slice(0, targetCount);
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
  const alternatives: Suggestion[] = [];
  const usedCombinations = new Set<string>();

  const availableBridges = bridges.filter(
    (bridge) => !bridge.ptoDays.some((day) => existingSuggestionSet.has(day.getTime()))
  );

  const maxDepth = Math.min(availableBridges.length, ptoDays * 2);
  const combinations = generateCombinationsWithBacktracking(
    availableBridges,
    ptoDays,
    minEfficiency,
    maxAlternatives * 3,
    maxDepth
  );

  const diversified = diversifyCombinations(combinations, maxAlternatives);

  for (const combo of diversified) {
    const key = getCombinationKey(combo.days);
    if (!usedCombinations.has(key)) {
      alternatives.push(combo);
      usedCombinations.add(key);
    }
  }

  return alternatives
    .toSorted((a, b) => {
      const effDiff = (b.efficiency ?? 0) - (a.efficiency ?? 0);
      return Math.abs(effDiff) > EFFICIENCY_COMPARISON_THRESHOLD
        ? effDiff
        : b.totalEffectiveDays - a.totalEffectiveDays;
    })
    .slice(0, maxAlternatives);
}

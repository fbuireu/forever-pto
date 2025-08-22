import { PTO_CONSTANTS } from '../../const';
import { Bridge, Suggestion } from '../../types';
import { getCombinationKey, getKey } from '../../utils/cache';

export function findAlternativeCombinations(
  bridges: Bridge[],
  ptoDays: number,
  existingSuggestionSet: Set<number>,
  maxAlternatives: number,
  minEfficiency: number
): Suggestion[] {
  const alternatives: Suggestion[] = [];
  const usedCombinations = new Set<string>();

  // Filtrar puentes disponibles
  const availableBridges = bridges.filter(
    (bridge) => !bridge.ptoDays.some((day) => existingSuggestionSet.has(day.getTime()))
  );

  // Usar backtracking con límite de profundidad adaptativo
  const maxDepth = Math.min(availableBridges.length, ptoDays * 2);
  const combinations = generateCombinationsWithBacktracking(
    availableBridges,
    ptoDays,
    minEfficiency,
    maxAlternatives * 3, // Generar más para luego filtrar
    maxDepth
  );

  // Diversificar resultados por distribución temporal
  const diversified = diversifyCombinations(combinations, maxAlternatives);

  for (const combo of diversified) {
    const key = getCombinationKey(combo.days);
    if (!usedCombinations.has(key)) {
      alternatives.push(combo);
      usedCombinations.add(key);
    }
  }

  return alternatives
    .sort((a, b) => {
      const effDiff = (b.efficiency || 0) - (a.efficiency || 0);
      return Math.abs(effDiff) > PTO_CONSTANTS.BRIDGE_GENERATION.EFFICIENCY_COMPARISON_THRESHOLD
        ? effDiff
        : b.totalEffectiveDays - a.totalEffectiveDays;
    })
    .slice(0, maxAlternatives);
}

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
    // Estado para evitar duplicados
    const stateKey = `${index}-${remainingDays}-${Array.from(usedDates).sort().join(',')}`;
    if (visitedStates.has(stateKey)) return;
    visitedStates.add(stateKey);

    // Caso base: objetivo alcanzado
    if (remainingDays === 0) {
      const days = selected.flatMap((b) => b.ptoDays);
      const totalEffective = selected.reduce((sum, b) => sum + b.effectiveDays, 0);
      const efficiency = totalEffective / days.length;

      if (efficiency >= minEfficiency) {
        results.push({
          days: days.sort((a, b) => a.getTime() - b.getTime()),
          totalEffectiveDays: totalEffective,
          efficiency,
          bridges: selected,
        });
      }
      return;
    }

    // Límites de búsqueda
    if (results.length >= maxResults || depth > maxDepth || index >= bridges.length) {
      return;
    }

    // Probar cada puente restante
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

  // Agrupar por características para diversificar
  const grouped = new Map<string, Suggestion[]>();

  combinations.forEach((combo) => {
    // Crear una clave basada en distribución temporal
    const months = combo.days.map((d) => d.getMonth());
    const uniqueMonths = new Set(months);
    const spread = uniqueMonths.size;
    const groupKey = `${spread}-${Math.floor(combo.efficiency || 0)}`;
    if (!grouped.has(groupKey)) {
      grouped.set(groupKey, []);
    }
    grouped.get(groupKey)!.push(combo);
  });

  // Tomar elementos de cada grupo proporcionalmente
  const result: Suggestion[] = [];
  const perGroup = Math.ceil(targetCount / grouped.size);

  for (const [_, group] of grouped) {
    result.push(...group.slice(0, perGroup));
  }

  return result.slice(0, targetCount);
}

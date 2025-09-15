import type { HolidayDTO } from '@application/dto/holiday/types';
import { isWeekend } from 'date-fns';
import { selectBridgesForStrategy, selectOptimalDaysFromBridges } from '../suggestions/utils/selectors';
import type { Bridge, Suggestion } from '../types';
import { FilterStrategy } from '../types';
import { getCombinationKey } from '../utils/cache';
import { findBridges, getAvailableWorkdays } from '../utils/helpers';

export interface GenerateAlternativesParams {
  year: number;
  ptoDays: number;
  holidays: HolidayDTO[];
  allowPastDays: boolean;
  months: Date[];
  maxAlternatives: number;
  existingSuggestion: Date[];
  strategy: FilterStrategy;
}

export function generateAlternatives(params: GenerateAlternativesParams): Suggestion[] {
  const { ptoDays, holidays, allowPastDays, months, maxAlternatives, existingSuggestion, strategy } = params;

  if (ptoDays <= 0 || maxAlternatives <= 0 || existingSuggestion.length === 0) {
    return [];
  }

  const effectiveHolidays = holidays.filter((h) => {
    const date = new Date(h.date);
    return !isWeekend(date);
  });

  const availableWorkdays = getAvailableWorkdays({
    months,
    holidays: effectiveHolidays,
    allowPastDays,
  });

  const bridges = findBridges({ availableWorkdays, holidays: effectiveHolidays });

  const existingSuggestionSet = new Set(existingSuggestion.map((d) => d.getTime()));
  const availableBridges = bridges.filter(
    (bridge) => !bridge.ptoDays.some((day) => existingSuggestionSet.has(day.getTime()))
  );

  const alternatives: Suggestion[] = [];
  const usedCombinations = new Set<string>();
  const sortingStrategies = [
    (a: Bridge, b: Bridge) => b.efficiency - a.efficiency,
    (a: Bridge, b: Bridge) => b.effectiveDays - a.effectiveDays,
    (a: Bridge, b: Bridge) => b.ptoDaysNeeded - a.ptoDaysNeeded,
    (a: Bridge, b: Bridge) => b.efficiency * b.ptoDaysNeeded - a.efficiency * a.ptoDaysNeeded,
    (a: Bridge, b: Bridge) => (a.ptoDays[0]?.getMonth() || 0) - (b.ptoDays[0]?.getMonth() || 0),
    (a: Bridge, b: Bridge) => a.efficiency - b.efficiency,
    (a: Bridge, b: Bridge) => Math.sin(a.efficiency * 1000) - Math.sin(b.efficiency * 1000),
  ];
  const maxAttempts = Math.max(maxAlternatives * 3, 15);

  for (let attempt = 0; attempt < maxAttempts && alternatives.length < maxAlternatives; attempt++) {
    const shuffledBridges = [...availableBridges];
    const strategyIndex = attempt % sortingStrategies.length;
    shuffledBridges.sort(sortingStrategies[strategyIndex]);
    if (attempt >= sortingStrategies.length) {
      const rotateBy = attempt - sortingStrategies.length;
      shuffledBridges.push(...shuffledBridges.splice(0, rotateBy % Math.max(shuffledBridges.length, 1)));
    }
    const selection =
      strategy === FilterStrategy.BALANCED
        ? selectOptimalDaysFromBridges({ bridges: shuffledBridges, targetPtoDays: ptoDays })
        : selectBridgesForStrategy({ bridges: shuffledBridges, targetPtoDays: ptoDays, strategy });
    if (selection.days.length > 0) {
      const alternative: Suggestion = {
        days: selection.days.toSorted((a, b) => a.getTime() - b.getTime()),
        totalEffectiveDays: selection.totalEffectiveDays,
        efficiency: selection.days.length > 0 ? selection.totalEffectiveDays / selection.days.length : 0,
        bridges: selection.bridges,
        strategy,
      };

      const combinationKey = getCombinationKey(alternative.days);
      if (!usedCombinations.has(combinationKey)) {
        alternatives.push(alternative);
        usedCombinations.add(combinationKey);
      }
    }
  }

  return alternatives.sort((a, b) => b.totalEffectiveDays - a.totalEffectiveDays).slice(0, maxAlternatives);
}

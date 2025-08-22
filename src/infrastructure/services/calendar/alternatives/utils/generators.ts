import type { HolidayDTO } from '@application/dto/holiday/types';
import { PTO_CONSTANTS } from '../../const';
import type { Suggestion } from '../../types';
import { findBridges } from '../../utils/helpers';
import { GenerateAlternativesParams } from '../generateAlternatives';
import { findAlternativeCombinations } from './helpers';

// Main strategy functions
export function generateGroupedAlternatives(
  params: GenerateAlternativesParams,
  availableWorkdays: Date[],
  effectiveHolidays: HolidayDTO[],
  existingSuggestionSet: Set<number>
): Suggestion[] {
  const { ptoDays, maxAlternatives } = params;

  const bridges = findBridges(availableWorkdays, effectiveHolidays);

  // For grouped strategy, prefer larger blocks
  const sortedBridges = bridges.sort((a, b) => {
    // Prioritize multi-day bridges for grouping
    if (a.ptoDaysNeeded !== b.ptoDaysNeeded) {
      return b.ptoDaysNeeded - a.ptoDaysNeeded;
    }
    return b.efficiency - a.efficiency;
  });

  return findAlternativeCombinations(
    sortedBridges,
    ptoDays,
    existingSuggestionSet,
    maxAlternatives,
    PTO_CONSTANTS.BRIDGE_GENERATION.MIN_EFFICIENCY_FOR_ALTERNATIVES
  );
}

export function generateOptimizedAlternatives(
  params: GenerateAlternativesParams,
  availableWorkdays: Date[],
  effectiveHolidays: HolidayDTO[],
  existingSuggestionSet: Set<number>
): Suggestion[] {
  const { ptoDays, maxAlternatives } = params;

  const bridges = findBridges(availableWorkdays, effectiveHolidays);

  // For optimized strategy, pure efficiency focus
  const sortedBridges = bridges.sort((a, b) => {
    const effDiff = b.efficiency - a.efficiency;
    if (Math.abs(effDiff) > 0.1) return effDiff;
    return b.effectiveDays - a.effectiveDays;
  });

  return findAlternativeCombinations(
    sortedBridges,
    ptoDays,
    existingSuggestionSet,
    maxAlternatives,
    PTO_CONSTANTS.BRIDGE_GENERATION.MIN_EFFICIENCY_FOR_OPTIMIZED
  );
}

export function generateBalancedAlternatives(
  params: GenerateAlternativesParams,
  availableWorkdays: Date[],
  effectiveHolidays: HolidayDTO[],
  existingSuggestionSet: Set<number>
): Suggestion[] {
  const { ptoDays, maxAlternatives } = params;

  const bridges = findBridges(availableWorkdays, effectiveHolidays);

  // For balanced strategy, mix of efficiency and grouping
  const sortedBridges = bridges.sort((a, b) => {
    // Balance between efficiency and block size
    const aScore = a.efficiency * (a.ptoDaysNeeded > 1 ? 1.2 : 1);
    const bScore = b.efficiency * (b.ptoDaysNeeded > 1 ? 1.2 : 1);
    return bScore - aScore;
  });

  return findAlternativeCombinations(
    sortedBridges,
    ptoDays,
    existingSuggestionSet,
    maxAlternatives,
    PTO_CONSTANTS.BRIDGE_GENERATION.MIN_EFFICIENCY_FOR_ALTERNATIVES
  );
}

import type { HolidayDTO } from '@application/dto/holiday/types';
import { PTO_CONSTANTS } from '../../const';
import type { Suggestion } from '../../types';
import { findBridges } from '../../utils/helpers';
import { GenerateAlternativesParams } from '../generateAlternatives';
import { findAlternativeCombinations } from './helpers';

interface GenerateAlternativesBaseParams {
  params: GenerateAlternativesParams;
  availableWorkdays: Date[];
  effectiveHolidays: HolidayDTO[];
  existingSuggestionSet: Set<number>;
}

export function generateGroupedAlternatives({
  params,
  availableWorkdays,
  effectiveHolidays,
  existingSuggestionSet,
}: GenerateAlternativesBaseParams): Suggestion[] {
  const { ptoDays, maxAlternatives } = params;
  const { MIN_EFFICIENCY_FOR_ALTERNATIVES } = PTO_CONSTANTS.BRIDGE_GENERATION;

  const bridges = findBridges({ availableWorkdays, holidays: effectiveHolidays });

  const sortedBridges = bridges.toSorted((a, b) => {
    if (a.ptoDaysNeeded !== b.ptoDaysNeeded) {
      return b.ptoDaysNeeded - a.ptoDaysNeeded;
    }
    return b.efficiency - a.efficiency;
  });

  return findAlternativeCombinations({
    bridges: sortedBridges,
    ptoDays,
    existingSuggestionSet,
    maxAlternatives,
    minEfficiency: MIN_EFFICIENCY_FOR_ALTERNATIVES,
  });
}

export function generateOptimizedAlternatives({
  params,
  availableWorkdays,
  effectiveHolidays,
  existingSuggestionSet,
}: GenerateAlternativesBaseParams): Suggestion[] {
  const { ptoDays, maxAlternatives } = params;
  const { MIN_EFFICIENCY_FOR_OPTIMIZED } = PTO_CONSTANTS.BRIDGE_GENERATION;

  const bridges = findBridges({ availableWorkdays, holidays: effectiveHolidays });

  const sortedBridges = bridges.toSorted((a, b) => {
    const effDiff = b.efficiency - a.efficiency;
    if (Math.abs(effDiff) > 0.1) return effDiff;
    return b.effectiveDays - a.effectiveDays;
  });

  return findAlternativeCombinations({
    bridges: sortedBridges,
    ptoDays,
    existingSuggestionSet,
    maxAlternatives,
    minEfficiency: MIN_EFFICIENCY_FOR_OPTIMIZED,
  });
}

export function generateBalancedAlternatives({
  params,
  availableWorkdays,
  effectiveHolidays,
  existingSuggestionSet,
}: GenerateAlternativesBaseParams): Suggestion[] {
  const { ptoDays, maxAlternatives } = params;
  const {
    SCORING: { BASE_SCORE, BALANCED_MULTI_DAY },
    BRIDGE_GENERATION: { MIN_EFFICIENCY_FOR_BALANCED },
  } = PTO_CONSTANTS;

  const bridges = findBridges({ availableWorkdays, holidays: effectiveHolidays });

  const sortedBridges = bridges.toSorted((a, b) => {
    const aScore = a.efficiency * (a.ptoDaysNeeded > BASE_SCORE ? BALANCED_MULTI_DAY : BASE_SCORE);
    const bScore = b.efficiency * (b.ptoDaysNeeded > BASE_SCORE ? BALANCED_MULTI_DAY : BASE_SCORE);
    return bScore - aScore;
  });

  return findAlternativeCombinations({
    bridges: sortedBridges,
    ptoDays,
    existingSuggestionSet,
    maxAlternatives,
    minEfficiency: MIN_EFFICIENCY_FOR_BALANCED,
  });
}

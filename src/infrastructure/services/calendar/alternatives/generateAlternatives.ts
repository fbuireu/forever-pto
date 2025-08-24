import type { HolidayDTO } from '@application/dto/holiday/types';
import { isWeekend } from 'date-fns';
import { FilterStrategy, Suggestion } from '../types';
import { getAvailableWorkdays } from '../utils/helpers';
import {
  generateBalancedAlternatives,
  generateGroupedAlternatives,
  generateOptimizedAlternatives,
} from './utils/generators';

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

const STRATEGY_MAP = new Map([
  [FilterStrategy.OPTIMIZED, generateOptimizedAlternatives],
  [FilterStrategy.BALANCED, generateBalancedAlternatives],
  [FilterStrategy.GROUPED, generateGroupedAlternatives],
]);

const DEFAULT_STRATEGY = generateGroupedAlternatives;

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

  const existingSuggestionSet = new Set(existingSuggestion.map((d) => d.getTime()));


    
  const strategyFunction = STRATEGY_MAP.get(strategy) ?? DEFAULT_STRATEGY;

  return strategyFunction({ params, availableWorkdays, effectiveHolidays, existingSuggestionSet });
}

import type { HolidayDTO } from '@application/dto/holiday/types';
import { isWeekend } from 'date-fns';
import { OptimizationStrategy, Suggestion } from '../types';
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
  strategy: OptimizationStrategy;
}

export function generateAlternatives(params: GenerateAlternativesParams): Suggestion[] {
  const {
    ptoDays,
    holidays,
    allowPastDays,
    months,
    maxAlternatives,
    existingSuggestion,
    strategy = 'grouped',
  } = params;
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

  const strategyMap = {
    optimized: generateOptimizedAlternatives,
    balanced: generateBalancedAlternatives,
    grouped: generateGroupedAlternatives,
  } as const;

  const generateFunction = strategyMap[strategy] || strategyMap.grouped;

  return generateFunction(params, availableWorkdays, effectiveHolidays, existingSuggestionSet);
}

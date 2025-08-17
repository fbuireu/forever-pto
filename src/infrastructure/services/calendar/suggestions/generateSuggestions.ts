import type { HolidayDTO } from '@application/dto/holiday/types';
import { isWeekend } from 'date-fns';
import type { OptimizationStrategy, Suggestion } from '../types';
import { clearDateKeyCache, clearHolidayCache, findBridgesOptimized } from '../utils/cache';
import { getAvailableWorkdays, validateAndCleanSuggestion } from '../utils/helpers';
import { selectOptimalDaysFromBridges } from '../utils/selectors';

export interface GenerateSuggestionsParams {
  year: number;
  ptoDays: number;
  holidays: HolidayDTO[];
  allowPastDays: boolean;
  months: Date[];
  strategy: OptimizationStrategy;
}

export function generateSuggestions(params: GenerateSuggestionsParams): Suggestion {
  const { ptoDays, holidays, allowPastDays, months, strategy = 'grouped' } = params;
  clearDateKeyCache();
  clearHolidayCache();
  if (ptoDays <= 0) {
    return { days: [], totalEffectiveDays: 0 };
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

  if (availableWorkdays.length < ptoDays) {
    return { days: [], totalEffectiveDays: 0 };
  }

  console.log('🔍 Processing workdays:', {
    totalWorkdays: availableWorkdays.length,
    effectiveHolidays: effectiveHolidays.length,
    months: months.length,
    ptoDays,
  });

  // Si hay más de 100 días, limítalo:
  const limitedWorkdays = availableWorkdays.length > 100 ? availableWorkdays.slice(0, 100) : availableWorkdays;

  const bridges = findBridgesOptimized(
    limitedWorkdays, // ✅ Limitar a 100 días máximo
    effectiveHolidays
  );

  const selection = selectOptimalDaysFromBridges(bridges, ptoDays);

  return validateAndCleanSuggestion({
    days: selection.days,
    totalEffectiveDays: selection.totalEffectiveDays,
    efficiency: selection.totalEffectiveDays / selection.days.length,
    bridges: selection.bridges,
    strategy,
  });
}

import type { HolidayDTO } from '@application/dto/holiday/types';
import { isWeekend } from 'date-fns';
import type { OptimizationStrategy, Suggestion } from '../types';
import { clearDateKeyCache, clearHolidayCache } from '../utils/cache';
import { findBridges, getAvailableWorkdays } from '../utils/helpers';
import { selectBridgesForStrategy, selectOptimalDaysFromBridges } from '../utils/selectors';

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

  const bridges = findBridges(availableWorkdays, effectiveHolidays);
  const selection =
    strategy === 'balanced'
      ? selectOptimalDaysFromBridges(bridges, ptoDays)
      : selectBridgesForStrategy(bridges, ptoDays, strategy);
  return {
    days: selection.days.sort((a, b) => a.getTime() - b.getTime()),
    totalEffectiveDays: selection.totalEffectiveDays,
    efficiency: selection.days.length > 0 ? selection.totalEffectiveDays / selection.days.length : 0,
    bridges: selection.bridges,
    strategy,
  };
}

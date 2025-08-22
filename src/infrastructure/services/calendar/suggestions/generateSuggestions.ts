import type { HolidayDTO } from '@application/dto/holiday/types';
import { isWeekend } from 'date-fns';
import { Bridge, OptimizationStrategy, Suggestion } from '../types';
import { clearDateKeyCache, clearHolidayCache } from '../utils/cache';
import { findBridges, getAvailableWorkdays } from '../utils/helpers';
import { selectBridgesForStrategy, selectOptimalDaysFromBridges } from './utils/selectors';

export interface GenerateSuggestionsParams {
  year: number;
  ptoDays: number;
  holidays: HolidayDTO[];
  allowPastDays: boolean;
  months: Date[];
  strategy: OptimizationStrategy;
}

export function generateSuggestions({
  ptoDays,
  holidays,
  allowPastDays,
  months,
  strategy,
}: GenerateSuggestionsParams): Suggestion {
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

  const bridges = findBridges({ availableWorkdays, holidays: effectiveHolidays });

  const STRATEGY_MAP = {
    balanced: (bridges: Bridge[], ptoDays: number) => selectOptimalDaysFromBridges({ bridges, targetPtoDays: ptoDays }),
    grouped: (bridges: Bridge[], ptoDays: number) =>
      selectBridgesForStrategy({ bridges, targetPtoDays: ptoDays, strategy: OptimizationStrategy.GROUPED }),
    optimized: (bridges: Bridge[], ptoDays: number) =>
      selectBridgesForStrategy({ bridges, targetPtoDays: ptoDays, strategy: OptimizationStrategy.OPTIMIZED }),
  };

  const selector = STRATEGY_MAP[strategy] || STRATEGY_MAP.grouped;
  const selection = selector(bridges, ptoDays);

  return {
    days: selection.days.toSorted((a, b) => a.getTime() - b.getTime()),
    totalEffectiveDays: selection.totalEffectiveDays,
    efficiency: selection.days.length > 0 ? selection.totalEffectiveDays / selection.days.length : 0,
    bridges: selection.bridges,
    strategy,
  };
}

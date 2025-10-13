import type { HolidayDTO } from '@application/dto/holiday/types';
import { isWeekend } from 'date-fns';
import type { Bridge, Suggestion } from '../types';
import { FilterStrategy } from '../types';
import { clearDateKeyCache, clearHolidayCache } from '../utils/cache';
import { findBridges, getAvailableWorkdays } from '../utils/helpers';
import { selectBridgesForStrategy, selectOptimalDaysFromBridges } from './utils/selectors';
import type { Locale } from 'next-intl';
import { generateMetrics } from '../metrics/generateMetrics';

export interface GenerateSuggestionsParams {
  year: number;
  ptoDays: number;
  holidays: HolidayDTO[];
  allowPastDays: boolean;
  months: Date[];
  strategy: FilterStrategy;
  locale: Locale;
}

const selectGroupedStrategy = (bridges: Bridge[], ptoDays: number) =>
  selectBridgesForStrategy({ bridges, targetPtoDays: ptoDays, strategy: FilterStrategy.GROUPED });

const selectOptimizedStrategy = (bridges: Bridge[], ptoDays: number) =>
  selectBridgesForStrategy({ bridges, targetPtoDays: ptoDays, strategy: FilterStrategy.OPTIMIZED });

const selectBalancedStrategy = (bridges: Bridge[], ptoDays: number) =>
  selectOptimalDaysFromBridges({ bridges, targetPtoDays: ptoDays });

const DEFAULT_STRATEGY = selectGroupedStrategy;

const STRATEGY_MAP = {
  [FilterStrategy.BALANCED]: selectBalancedStrategy,
  [FilterStrategy.GROUPED]: selectGroupedStrategy,
  [FilterStrategy.OPTIMIZED]: selectOptimizedStrategy,
} as const;

export function generateSuggestions({
  ptoDays,
  holidays,
  allowPastDays,
  months,
  strategy,
  locale,
}: GenerateSuggestionsParams): Suggestion {
  clearDateKeyCache();
  clearHolidayCache();

  if (ptoDays <= 0) {
    return { days: [], strategy };
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
    return { days: [], strategy };
  }

  const bridges = findBridges({ availableWorkdays, holidays: effectiveHolidays });

  const selector = STRATEGY_MAP[strategy] ?? DEFAULT_STRATEGY;

  const selection = selector(bridges, ptoDays);

  return {
    days: selection.days.toSorted((a, b) => a.getTime() - b.getTime()),
    bridges: selection.bridges,
    strategy,
    metrics: generateMetrics({
      suggestion: { days: selection.days, bridges: selection.bridges, strategy },
      allowPastDays,
      locale,
      bridges: selection.bridges,
      holidays,
    }),
  };
}

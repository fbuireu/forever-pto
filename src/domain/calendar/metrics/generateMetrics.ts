import type { HolidayDTO } from '@application/dto/holiday/types';
import type { Locale } from 'next-intl';
import type { Bridge, Suggestion } from '../types';
import { resolveSelectedDays } from '../utils/selection';
import {
  calculateLongestVacation,
  calculateLongWeekends,
  calculateMaxWorkStreak,
  calculateQuarterDistribution,
  calculateRestBlocks,
  getFirstLastBreak,
  getLongBlocksPerQuarter,
  getMonthlyDist,
  getTotalEffectiveDays,
  getWorkedDaysPerMonth,
} from './utils/helpers';

interface GenerateMetricsParams {
  suggestion: Omit<Suggestion, 'metrics'>;
  locale: Locale;
  year: number;
  bridges?: Bridge[];
  holidays: HolidayDTO[];
  allowPastDays: boolean;
  manuallySelectedDays?: Date[];
  removedSuggestedDays?: Date[];
  totalPtoBudget?: number;
}

export const generateMetrics = ({
  suggestion,
  locale,
  year,
  bridges,
  holidays,
  allowPastDays,
  manuallySelectedDays = [],
  removedSuggestedDays = [],
}: GenerateMetricsParams) => {
  const days = resolveSelectedDays({ days: suggestion.days, manuallySelectedDays, removedSuggestedDays });
  const holidaysInWindow = holidays.filter((holiday) => holiday.isInSelectedRange);

  if (days.length === 0) {
    return {
      longWeekends: 0,
      restBlocks: 0,
      maxWorkStreak: 0,
      firstLastBreak: null,
      averageEfficiency: 0,
      bonusDays: 0,
      quarterDist: [0, 0, 0, 0],
      bridgesUsed: 0,
      workedDaysPerMonth: 0,
      totalEffectiveDays: 0,
      monthlyDist: new Array(12).fill(0),
      longBlocksPerQuarter: new Array(4).fill(0),
      longestVacation: 0,
    };
  }
  const monthlyDist = getMonthlyDist(days);
  const longBlocksPerQuarter = getLongBlocksPerQuarter({ ptoDays: days, holidays: holidaysInWindow });
  const totalEffectiveDays = getTotalEffectiveDays(days, bridges);
  const longWeekends = calculateLongWeekends({ ptoDays: days, holidays: holidaysInWindow });
  const longestVacation = calculateLongestVacation({ ptoDays: days, holidays: holidaysInWindow });

  const restBlocks = calculateRestBlocks(days);
  const maxWorkStreak = calculateMaxWorkStreak({
    ptoDays: days,
    holidays: holidaysInWindow,
    allowPastDays,
    year,
  });
  const firstLastBreak = getFirstLastBreak({ dates: days, locale });
  const quarterDist = calculateQuarterDistribution(days);
  const workedDaysPerMonth = getWorkedDaysPerMonth({
    ptoDays: days,
    holidays: holidaysInWindow,
    year,
  });
  const efficiency = totalEffectiveDays / days.length;

  const bonusDays = totalEffectiveDays - days.length;

  return {
    longWeekends,
    restBlocks,
    maxWorkStreak,
    firstLastBreak,
    averageEfficiency: efficiency,
    bonusDays,
    quarterDist,
    bridgesUsed: bridges?.length ?? 0,
    workedDaysPerMonth,
    totalEffectiveDays,
    monthlyDist,
    longBlocksPerQuarter,
    longestVacation,
  };
};

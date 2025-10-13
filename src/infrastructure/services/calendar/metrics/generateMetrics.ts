import { formatDate } from '@ui/modules/components/utils/formatters';
import type { Locale } from 'next-intl';
import type { Bridge, Metrics, Suggestion } from '../types';
import {
  calculateMaxWorkingPeriod,
  calculateQuarterDistribution,
  calculateRestBlocks,
  getFirstLastBreak,
  getLongBlocksPerQuarter,
  getMonthlyDist,
  getTotalEffectiveDays,
  getWorkingDaysPerMonth,
} from './utils/helpers';
import type { HolidayDTO } from '@application/dto/holiday/types';

interface GenerateMetricsParams {
  suggestion: Omit<Suggestion, 'metrics'>;
  locale: Locale;
  bridges?: Bridge[];
  holidays: HolidayDTO[];
  allowPastDays: boolean;
}

export const generateMetrics = ({
  suggestion,
  locale,
  bridges,
  holidays,
  allowPastDays,
}: GenerateMetricsParams): Metrics => {
  const { days } = suggestion;

  if (days.length === 0) {
    return {
      longWeekends: 0,
      restBlocks: 0,
      maxWorkingPeriod: 0,
      firstLastBreak: null,
      averageEfficiency: 0,
      bonusDays: 0,
      quarterDist: [0, 0, 0, 0],
      bridgesUsed: 0,
      workingDaysPerMonth: 0,
      totalEffectiveDays: 0,
      efficiency: 0,
      monthlyDist: Array(12).fill(0),
      longBlocksPerQuarter: Array(4).fill(0),
    };
  }
  const monthlyDist = getMonthlyDist(days);
  const longBlocksPerQuarter = getLongBlocksPerQuarter(days);
  const totalEffectiveDays = getTotalEffectiveDays(days, bridges);
  const longWeekends = days.filter((date) => {
    const dayOfWeek = date.getDay();
    return dayOfWeek === 1 || dayOfWeek === 5;
  }).length;

  const restBlocks = calculateRestBlocks(days);
  const maxWorkingPeriod = calculateMaxWorkingPeriod({
    ptoDays: days,
    holidays,
    allowPastDays,
    year: formatDate({ date: days[0], format: 'yyyy', locale }),
  });
  const firstLastBreak = getFirstLastBreak({ dates: days, locale });
  const quarterDist = calculateQuarterDistribution(days);
  const workingDaysPerMonth = getWorkingDaysPerMonth({
    ptoDays: days,
    holidays,
    year: formatDate({ date: days[0], format: 'yyyy', locale }),
  });
  const efficiency = totalEffectiveDays / days.length;
  const bonusDays = totalEffectiveDays - days.length;

  return {
    longWeekends,
    restBlocks,
    maxWorkingPeriod,
    firstLastBreak,
    averageEfficiency: efficiency,
    bonusDays,
    quarterDist,
    bridgesUsed: bridges?.length ?? 0,
    workingDaysPerMonth,
    totalEffectiveDays,
    efficiency,
    monthlyDist,
    longBlocksPerQuarter,
  };
};

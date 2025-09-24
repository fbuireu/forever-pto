import { Locale } from 'next-intl';
import type { Bridge, Metrics, Suggestion } from '../types';
import {
  calculateMaxWorkingPeriod,
  calculateQuarterDistribution,
  calculateRestBlocks,
  getFirstLastBreak,
  getLongBlocksPerQuarter,
  getMonthlyDist,
  getMostActiveQuarters,
  getTotalEffectiveDays,
} from './utils/helpers';

interface GenerateMetricsParams {
  suggestion: Omit<Suggestion, 'metrics'>;
  locale: Locale;
  bridges?: Bridge[];
}

export const generateMetrics = ({ suggestion, locale, bridges }: GenerateMetricsParams): Metrics => {
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
      activeQuarters: '',
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
  const maxWorkingPeriod = calculateMaxWorkingPeriod(days);
  const firstLastBreak = getFirstLastBreak({ dates: days, locale });
  const quarterDist = calculateQuarterDistribution(days);
  const activeQuarters = getMostActiveQuarters(quarterDist);
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
    activeQuarters,
    totalEffectiveDays,
    efficiency,
    monthlyDist,
    longBlocksPerQuarter,
  };
};

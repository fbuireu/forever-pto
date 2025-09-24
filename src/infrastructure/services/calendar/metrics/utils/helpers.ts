export function getMonthlyDist(days: Date[]): number[] {
  const monthlyDist = Array(12).fill(0);
  days.forEach((date) => {
    monthlyDist[date.getMonth()]++;
  });
  return monthlyDist;
}

export function getLongBlocksPerQuarter(days: Date[]): number[] {
  const longBlocksPerQuarter = [0, 0, 0, 0];
  const sorted = [...days].sort((a, b) => a.getTime() - b.getTime());
  let currentBlock: Date[] = [];
  let lastQuarter = null;
  for (const date of sorted) {
    const quarter = Math.floor(date.getMonth() / 3);
    if (
      currentBlock.length === 0 ||
      (date.getTime() - currentBlock[currentBlock.length - 1].getTime()) / (1000 * 60 * 60 * 24) === 1
    ) {
      currentBlock.push(date);
      lastQuarter = quarter;
    } else {
      if (currentBlock.length >= 3 && lastQuarter !== null) {
        longBlocksPerQuarter[lastQuarter]++;
      }
      currentBlock = [date];
      lastQuarter = quarter;
    }
  }
  if (currentBlock.length >= 3 && lastQuarter !== null) {
    longBlocksPerQuarter[lastQuarter]++;
  }
  return longBlocksPerQuarter;
}

export function getTotalEffectiveDays(days: Date[], bridges?: { effectiveDays: number }[]): number {
  if (bridges) {
    return bridges.reduce((sum, bridge) => sum + bridge.effectiveDays, 0);
  }
  return days.length;
}
import { formatDate } from '@ui/modules/components/utils/formatters';
import { getMonth } from 'date-fns';
import { Locale } from 'next-intl';
import { FirstLastBreak } from '../../types';

export const calculateRestBlocks = (dates: Date[]): number => {
  if (dates.length === 0) return 0;

  let blocks = 1;
  const sorted = [...dates].sort((a, b) => a.getTime() - b.getTime());

  for (let i = 1; i < sorted.length; i++) {
    const daysDiff = (sorted[i].getTime() - sorted[i - 1].getTime()) / (1000 * 60 * 60 * 24);
    if (daysDiff > 7) blocks++;
  }

  return blocks;
};

export const calculateMaxWorkingPeriod = (dates: Date[]): number => {
  if (dates.length < 2) return 0;

  const sorted = [...dates].sort((a, b) => a.getTime() - b.getTime());
  let maxGap = 0;

  for (let i = 1; i < sorted.length; i++) {
    const gap = (sorted[i].getTime() - sorted[i - 1].getTime()) / (1000 * 60 * 60 * 24) - 1;
    if (gap > maxGap) maxGap = gap;
  }

  return Math.max(0, Math.floor(maxGap));
};

interface GetFirstLastBreak {
  dates: Date[];
  locale: Locale;
}
export const getFirstLastBreak = ({ dates, locale }: GetFirstLastBreak): FirstLastBreak | null => {
  if (dates.length === 0) return null;

  const sorted = [...dates].sort((a, b) => a.getTime() - b.getTime());
  return {
    first: formatDate({ date: sorted[0], format: 'MMM', locale }),
    last: formatDate({ date: sorted[sorted.length - 1], format: 'MMM', locale }),
  };
};

export const calculateQuarterDistribution = (dates: Date[]): number[] => {
  const quarters = [0, 0, 0, 0]; // Q1, Q2, Q3, Q4

  dates?.forEach((date) => {
    const month = getMonth(date);
    const quarter = Math.floor(month / 3);
    quarters[quarter]++;
  });

  return quarters;
};

export const getMostActiveQuarters = (quarters: number[]): string => {
  const total = quarters.reduce((sum, q) => sum + q, 0);
  if (total === 0) return '';

  const maxDays = Math.max(...quarters);
  const topQuarters = quarters
    .map((days, index) => ({ quarter: `Q${index + 1}`, days }))
    .filter((q) => q.days === maxDays);

  if (topQuarters.length > 1) {
    return topQuarters.map((q) => q.quarter).join(' y ');
  }

  return topQuarters[0].quarter;
};

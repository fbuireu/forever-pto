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

export function getTotalEffectiveDays(
  days: Date[],
  bridges?: { effectiveDays: number; ptoDays: Date[] }[]
): number {
  if (!bridges || bridges.length === 0) {
    return days.length;
  }

  const daysSet = new Set(days.map((d) => d.toDateString()));

  const validBridges = bridges.filter((bridge) =>
    bridge.ptoDays.every((ptoDay) => daysSet.has(ptoDay.toDateString()))
  );

  const daysInBridges = new Set<string>();
  validBridges.forEach((bridge) => {
    bridge.ptoDays.forEach((ptoDay) => {
      daysInBridges.add(ptoDay.toDateString());
    });
  });

  const effectiveDaysFromBridges = validBridges.reduce((sum, bridge) => sum + bridge.effectiveDays, 0);
  const standaloneDays = days.filter((day) => !daysInBridges.has(day.toDateString())).length;

  return effectiveDaysFromBridges + standaloneDays;
}
import type { HolidayDTO } from '@application/dto/holiday/types';
import { formatDate } from '@ui/modules/components/utils/formatters';
import { eachDayOfInterval, endOfYear, getMonth, isWeekend, startOfToday, startOfYear } from 'date-fns';
import type { Locale } from 'next-intl';
import type { FirstLastBreak } from '../../types';

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

interface CalculateMaxWorkingPeriodParams {
  ptoDays: Date[];
  holidays: HolidayDTO[];
  year: string;
  allowPastDays: boolean;
}

export const calculateMaxWorkingPeriod = ({
  ptoDays,
  holidays,
  year,
  allowPastDays,
}: CalculateMaxWorkingPeriodParams): number => {
  const yearNum = parseInt(year);
  const yearStart = allowPastDays ? startOfYear(new Date(yearNum, 0, 1)) : startOfToday();
  const yearEnd = endOfYear(new Date(yearNum, 11, 31));
  if (yearStart > yearEnd) return 0;

  const restDays = new Set([...ptoDays.map((d) => d.toDateString()), ...holidays.map((h) => h.date.toDateString())]);

  let maxWorkingStreak = 0;
  let currentStreak = 0;

  for (const day of eachDayOfInterval({ start: yearStart, end: yearEnd })) {
    if (isWeekend(day)) continue;

    if (restDays.has(day.toDateString())) {
      maxWorkingStreak = Math.max(maxWorkingStreak, currentStreak);
      currentStreak = 0;
    } else {
      currentStreak++;
    }
  }

  maxWorkingStreak = Math.max(maxWorkingStreak, currentStreak);

  return maxWorkingStreak;
};
interface GetFirstLastBreak {
  dates: Date[];
  locale: Locale;
}
export const getFirstLastBreak = ({ dates, locale }: GetFirstLastBreak): FirstLastBreak | null => {
  if (dates.length === 0) return null;

  const sorted = [...dates].sort((a, b) => a.getTime() - b.getTime());
  return {
    first: formatDate({ date: sorted[0], format: 'MMMM', locale }),
    last: formatDate({ date: sorted[sorted.length - 1], format: 'MMMM', locale }),
  };
};

export const calculateQuarterDistribution = (dates: Date[]): number[] => {
  const quarters = [0, 0, 0, 0];

  dates?.forEach((date) => {
    const month = getMonth(date);
    const quarter = Math.floor(month / 3);
    quarters[quarter]++;
  });

  return quarters;
};

interface GetWorkingDaysPerWeekParams {
  ptoDays: Date[];
  year: string;
  holidays: HolidayDTO[];
}

export const getWorkingDaysPerMonth = ({ ptoDays, holidays, year }: GetWorkingDaysPerWeekParams): number => {
  const yearNum = parseInt(year);
  const yearStart = startOfYear(new Date(yearNum, 0, 1));
  const yearEnd = endOfYear(new Date(yearNum, 11, 31));
  const allDaysInYear = eachDayOfInterval({ start: yearStart, end: yearEnd });
  const workingDaysInYear = allDaysInYear.filter((day) => !isWeekend(day)).length;
  const holidaysOnWorkdays = holidays.filter((h) => !isWeekend(h.date)).length;
  const ptoOnWorkdays = ptoDays.filter((d) => !isWeekend(d)).length;
  const actualWorkingDays = workingDaysInYear - holidaysOnWorkdays - ptoOnWorkdays;
  const avgPerMonth = actualWorkingDays / 12;

  return parseFloat(avgPerMonth.toFixed(1));
};

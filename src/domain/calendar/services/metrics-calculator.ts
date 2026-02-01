import { formatDate } from '@domain/shared/utils/formatters';
import type { Holiday } from '@domain/calendar/models/types';
import { eachDayOfInterval, endOfYear, getMonth, isWeekend, startOfToday, startOfYear } from 'date-fns';
import type { Locale } from 'next-intl';
import type { Bridge, FirstLastBreak, Metrics, Suggestion } from '../models/types';

export interface GenerateMetricsParams {
  suggestion: Omit<Suggestion, 'metrics'>;
  locale: Locale;
  bridges?: Bridge[];
  holidays: Holiday[];
  allowPastDays: boolean;
  manuallySelectedDays?: Date[];
  removedSuggestedDays?: Date[];
  totalPtoBudget?: number;
}

function getMonthlyDist(days: Date[]): number[] {
  const monthlyDist = Array(12).fill(0);
  days.forEach((date) => {
    monthlyDist[date.getMonth()]++;
  });
  return monthlyDist;
}

function getLongBlocksPerQuarter(days: Date[]): number[] {
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

function getTotalEffectiveDays(days: Date[], bridges?: { effectiveDays: number; ptoDays: Date[] }[]): number {
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

function calculateRestBlocks(dates: Date[]): number {
  if (dates.length === 0) return 0;

  let blocks = 1;
  const sorted = [...dates].sort((a, b) => a.getTime() - b.getTime());

  for (let i = 1; i < sorted.length; i++) {
    const daysDiff = (sorted[i].getTime() - sorted[i - 1].getTime()) / (1000 * 60 * 60 * 24);
    if (daysDiff > 7) blocks++;
  }

  return blocks;
}

interface CalculateMaxWorkingPeriodParams {
  ptoDays: Date[];
  holidays: Holiday[];
  year: string;
  allowPastDays: boolean;
}

function calculateMaxWorkingPeriod({
  ptoDays,
  holidays,
  year,
  allowPastDays,
}: CalculateMaxWorkingPeriodParams): number {
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
}

interface GetFirstLastBreak {
  dates: Date[];
  locale: Locale;
}

function getFirstLastBreak({ dates, locale }: GetFirstLastBreak): FirstLastBreak | null {
  if (dates.length === 0) return null;

  const sorted = [...dates].sort((a, b) => a.getTime() - b.getTime());
  return {
    first: formatDate({ date: sorted[0], format: 'MMMM', locale }),
    last: formatDate({ date: sorted[sorted.length - 1], format: 'MMMM', locale }),
  };
}

function calculateQuarterDistribution(dates: Date[]): number[] {
  const quarters = [0, 0, 0, 0];

  dates?.forEach((date) => {
    const month = getMonth(date);
    const quarter = Math.floor(month / 3);
    quarters[quarter]++;
  });

  return quarters;
}

interface GetWorkingDaysPerWeekParams {
  ptoDays: Date[];
  year: string;
  holidays: Holiday[];
}

function getWorkingDaysPerMonth({ ptoDays, holidays, year }: GetWorkingDaysPerWeekParams): number {
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
}

export const generateMetrics = ({
  suggestion,
  locale,
  bridges,
  holidays,
  allowPastDays,
  manuallySelectedDays = [],
  removedSuggestedDays = [],
  totalPtoBudget,
}: GenerateMetricsParams): Metrics => {
  let days = suggestion.days;
  const hasManualChanges = manuallySelectedDays.length > 0 || removedSuggestedDays.length > 0;

  if (hasManualChanges) {
    const removedSet = new Set(removedSuggestedDays.map((d) => d.toDateString()));
    const filteredSuggested = suggestion.days.filter((d) => !removedSet.has(d.toDateString()));
    days = [...filteredSuggested, ...manuallySelectedDays].sort((a, b) => a.getTime() - b.getTime());
  }

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

  let bonusDays: number;
  if (hasManualChanges && totalPtoBudget) {
    const unusedDays = totalPtoBudget - days.length;
    const totalDaysOff = totalEffectiveDays + unusedDays;
    bonusDays = totalDaysOff - totalPtoBudget;
  } else {
    bonusDays = totalEffectiveDays - days.length;
  }

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
    monthlyDist,
    longBlocksPerQuarter,
  };
};

import type { HolidayDTO } from '@application/dto/holiday/types';
import {
  differenceInDays,
  eachDayOfInterval,
  endOfYear,
  formatDate,
  getMonth,
  getYear,
  isWeekend,
  startOfToday,
  startOfYear,
} from '@application/shared/utils/dates';
import type { Locale } from 'next-intl';
import type { Bridge } from '../../types';
import type { FreeStreak } from './streaks';

export const MONTHS_IN_YEAR = 12;
export const MONTHS_IN_QUARTER = 3;

const LONG_BLOCK_MINIMUM_DAYS = 3;
const LONG_WEEKEND_MINIMUM_DAYS = 3;

export interface PlanningWindowShape {
  year: number;
  carryOverMonths: number;
}

export const windowMonthCount = ({ carryOverMonths }: Pick<PlanningWindowShape, 'carryOverMonths'>) =>
  MONTHS_IN_YEAR + carryOverMonths;

export const windowQuarterCount = (window: Pick<PlanningWindowShape, 'carryOverMonths'>) =>
  Math.ceil(windowMonthCount(window) / MONTHS_IN_QUARTER);

export const windowMonthIndex = (date: Date, { year }: Pick<PlanningWindowShape, 'year'>) =>
  (getYear(date) - year) * MONTHS_IN_YEAR + getMonth(date);

export function getMonthlyDist(days: Date[], window: PlanningWindowShape) {
  const monthlyDist = new Array(windowMonthCount(window)).fill(0);
  days.forEach((date) => {
    const index = windowMonthIndex(date, window);
    if (index >= 0 && index < monthlyDist.length) monthlyDist[index]++;
  });
  return monthlyDist;
}

interface GetLongBlocksPerQuarterParams {
  streaks: FreeStreak[];
  window: PlanningWindowShape;
}

export function getLongBlocksPerQuarter({ streaks, window }: GetLongBlocksPerQuarterParams) {
  const longBlocksPerQuarter = new Array(windowQuarterCount(window)).fill(0);

  for (const streak of streaks) {
    if (streak.length < LONG_BLOCK_MINIMUM_DAYS) continue;

    const start = streak.days.find((day) => windowMonthIndex(day, window) >= 0);
    if (start === undefined) continue;

    const quarter = Math.floor(windowMonthIndex(start, window) / MONTHS_IN_QUARTER);
    if (quarter >= 0 && quarter < longBlocksPerQuarter.length) longBlocksPerQuarter[quarter]++;
  }

  return longBlocksPerQuarter;
}

export function getValidBridges(days: Date[], bridges?: Bridge[]) {
  if (!bridges || bridges.length === 0) return [];

  const daysSet = new Set(days.map((day) => day.toDateString()));

  return bridges.filter((bridge) => bridge.ptoDays.every((ptoDay) => daysSet.has(ptoDay.toDateString())));
}

export function getTotalEffectiveDays(days: Date[], bridges?: Bridge[], holidays: HolidayDTO[] = []) {
  const validBridges = getValidBridges(days, bridges);

  if (validBridges.length === 0) {
    return days.length;
  }

  const freeDays = new Set([...days.map((day) => day.toDateString()), ...holidays.map((h) => h.date.toDateString())]);
  const covered = new Set<string>();

  for (const bridge of validBridges) {
    for (const day of eachDayOfInterval({ start: bridge.startDate, end: bridge.endDate })) {
      const key = day.toDateString();
      if (isWeekend(day) || freeDays.has(key)) covered.add(key);
    }
  }

  for (const day of days) {
    covered.add(day.toDateString());
  }

  return covered.size;
}

export const calculateRestBlocks = (dates: Date[]) => {
  if (dates.length === 0) return 0;

  let blocks = 1;
  const sorted = dates.toSorted((a, b) => a.getTime() - b.getTime());

  for (let i = 1; i < sorted.length; i++) {
    const curr = sorted[i];
    const prev = sorted[i - 1];
    if (curr === undefined || prev === undefined) continue;
    const daysDiff = differenceInDays(curr, prev);
    if (daysDiff > 7) blocks++;
  }

  return blocks;
};

interface CalculateMaxWorkStreakParams {
  ptoDays: Date[];
  holidays: HolidayDTO[];
  year: number;
  allowPastDays: boolean;
}

export const calculateMaxWorkStreak = ({ ptoDays, holidays, year, allowPastDays }: CalculateMaxWorkStreakParams) => {
  const yearStart = startOfYear(new Date(year, 0, 1));
  const yearEnd = endOfYear(new Date(year, 11, 31));
  const today = startOfToday();
  const scanStart = allowPastDays || today < yearStart ? yearStart : today;
  if (scanStart > yearEnd) return 0;

  const restDays = new Set([...ptoDays.map((d) => d.toDateString()), ...holidays.map((h) => h.date.toDateString())]);

  let maxWorkStreak = 0;
  let currentStreak = 0;

  for (const day of eachDayOfInterval({ start: scanStart, end: yearEnd })) {
    if (isWeekend(day)) continue;

    if (restDays.has(day.toDateString())) {
      maxWorkStreak = Math.max(maxWorkStreak, currentStreak);
      currentStreak = 0;
    } else {
      currentStreak++;
    }
  }

  maxWorkStreak = Math.max(maxWorkStreak, currentStreak);

  return maxWorkStreak;
};
interface GetFirstLastBreak {
  dates: Date[];
  locale: Locale;
}
export const getFirstLastBreak = ({ dates, locale }: GetFirstLastBreak) => {
  if (dates.length === 0) return null;

  const sorted = dates.toSorted((a, b) => a.getTime() - b.getTime());
  const first = sorted.at(0);
  const last = sorted.at(-1);
  if (first === undefined || last === undefined) return null;
  return {
    first: formatDate({ date: first, format: 'MMMM', locale }),
    last: formatDate({ date: last, format: 'MMMM', locale }),
  };
};

export const calculateQuarterDistribution = (dates: Date[], window: PlanningWindowShape) => {
  const quarters = new Array(windowQuarterCount(window)).fill(0);

  dates?.forEach((date) => {
    const quarter = Math.floor(windowMonthIndex(date, window) / MONTHS_IN_QUARTER);
    if (quarter >= 0 && quarter < quarters.length) quarters[quarter]++;
  });

  return quarters;
};

interface GetWorkedDaysPerMonthParams {
  ptoDays: Date[];
  year: number;
  holidays: HolidayDTO[];
}

export const getWorkedDaysPerMonth = ({ ptoDays, holidays, year }: GetWorkedDaysPerMonthParams) => {
  const yearStart = startOfYear(new Date(year, 0, 1));
  const yearEnd = endOfYear(new Date(year, 11, 31));
  const allDaysInYear = eachDayOfInterval({ start: yearStart, end: yearEnd });
  const workdaysInYear = allDaysInYear.filter((day) => !isWeekend(day)).length;
  const daysOffOnWorkdays = new Set<string>();
  for (const date of [...holidays.map((h) => h.date), ...ptoDays]) {
    if (getYear(date) === year && !isWeekend(date)) daysOffOnWorkdays.add(date.toDateString());
  }
  const workedDays = workdaysInYear - daysOffOnWorkdays.size;
  const avgPerMonth = workedDays / 12;

  return Number.parseFloat(avgPerMonth.toFixed(1));
};

export const calculateLongestVacation = (streaks: FreeStreak[]) =>
  streaks.filter((streak) => streak.hasPlacedDay).reduce((longest, streak) => Math.max(longest, streak.length), 0);

export const calculateLongWeekends = (streaks: FreeStreak[]) =>
  streaks.filter((streak) => streak.length >= LONG_WEEKEND_MINIMUM_DAYS && streak.hasWeekend && streak.hasPlacedDay)
    .length;

import type { HolidayDTO } from '@application/dto/holiday/types';
import {
  addDays,
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

export function getMonthlyDist(days: Date[]) {
  const monthlyDist = new Array(12).fill(0);
  days.forEach((date) => {
    monthlyDist[getMonth(date)]++;
  });
  return monthlyDist;
}

interface GetLongBlocksPerQuarterParams {
  ptoDays: Date[];
  holidays: HolidayDTO[];
}

export function getLongBlocksPerQuarter({ ptoDays, holidays }: GetLongBlocksPerQuarterParams) {
  const longBlocksPerQuarter = [0, 0, 0, 0];
  if (ptoDays.length === 0) return longBlocksPerQuarter;

  const freeDays = new Set([...ptoDays.map((d) => d.toDateString()), ...holidays.map((h) => h.date.toDateString())]);
  const allDates = [...ptoDays, ...holidays.map((h) => h.date)].toSorted((a, b) => a.getTime() - b.getTime());

  const firstDate = allDates.at(0);
  const lastDate = allDates.at(-1);
  if (firstDate === undefined || lastDate === undefined) return longBlocksPerQuarter;

  let currentBlock: Date[] = [];

  const closeBlock = () => {
    const start = currentBlock.at(0);
    if (currentBlock.length >= 3 && start !== undefined) {
      longBlocksPerQuarter[Math.floor(getMonth(start) / 3)]++;
    }
    currentBlock = [];
  };

  for (const day of eachDayOfInterval({ start: addDays(firstDate, -7), end: addDays(lastDate, 7) })) {
    if (isWeekend(day) || freeDays.has(day.toDateString())) {
      currentBlock.push(day);
    } else {
      closeBlock();
    }
  }
  closeBlock();

  return longBlocksPerQuarter;
}

export function getTotalEffectiveDays(days: Date[], bridges?: Bridge[]) {
  if (!bridges || bridges.length === 0) {
    return days.length;
  }

  const daysSet = new Set(days.map((day) => day.toDateString()));
  const validBridges = bridges.filter((bridge) => bridge.ptoDays.every((ptoDay) => daysSet.has(ptoDay.toDateString())));

  if (validBridges.length === 0) {
    return days.length;
  }

  const covered = new Set<string>();

  for (const bridge of validBridges) {
    for (const day of eachDayOfInterval({ start: bridge.startDate, end: bridge.endDate })) {
      covered.add(day.toDateString());
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

export const calculateQuarterDistribution = (dates: Date[]) => {
  const quarters = [0, 0, 0, 0];

  dates?.forEach((date) => {
    const month = getMonth(date);
    const quarter = Math.floor(month / 3);
    quarters[quarter]++;
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
  const holidaysOnWorkdays = holidays.filter((h) => getYear(h.date) === year && !isWeekend(h.date)).length;
  const ptoOnWorkdays = ptoDays.filter((d) => getYear(d) === year && !isWeekend(d)).length;
  const workedDays = workdaysInYear - holidaysOnWorkdays - ptoOnWorkdays;
  const avgPerMonth = workedDays / 12;

  return Number.parseFloat(avgPerMonth.toFixed(1));
};

interface CalculateLongestVacationParams {
  ptoDays: Date[];
  holidays: HolidayDTO[];
}

export const calculateLongestVacation = ({ ptoDays, holidays }: CalculateLongestVacationParams) => {
  if (ptoDays.length === 0) return 0;

  const freeDays = new Set([...ptoDays.map((d) => d.toDateString()), ...holidays.map((h) => h.date.toDateString())]);

  const allDates = [...ptoDays, ...holidays.map((h) => h.date)].toSorted((a, b) => a.getTime() - b.getTime());
  if (allDates.length === 0) return 0;

  const firstDate = allDates.at(0);
  const lastDate = allDates.at(-1);
  if (firstDate === undefined || lastDate === undefined) return 0;

  const minDate = addDays(firstDate, -7);
  const maxDate = addDays(lastDate, 7);

  let longestVacation = 0;
  let currentStreak = 0;

  for (const day of eachDayOfInterval({ start: minDate, end: maxDate })) {
    const isFreeDay = isWeekend(day) || freeDays.has(day.toDateString());

    if (isFreeDay) {
      currentStreak++;
      longestVacation = Math.max(longestVacation, currentStreak);
    } else {
      currentStreak = 0;
    }
  }

  return longestVacation;
};

interface CalculateLongWeekendsParams {
  ptoDays: Date[];
  holidays: HolidayDTO[];
}

export const calculateLongWeekends = ({ ptoDays, holidays }: CalculateLongWeekendsParams) => {
  if (ptoDays.length === 0) return 0;

  const freeDays = new Set([...ptoDays.map((d) => d.toDateString()), ...holidays.map((h) => h.date.toDateString())]);

  let longWeekends = 0;
  const allDates = [...ptoDays, ...holidays.map((h) => h.date)].toSorted((a, b) => a.getTime() - b.getTime());
  if (allDates.length === 0) return 0;

  const firstDate = allDates.at(0);
  const lastDate = allDates.at(-1);
  if (firstDate === undefined || lastDate === undefined) return 0;

  const minDate = addDays(firstDate, -7);
  const maxDate = addDays(lastDate, 7);

  let currentStreak: Date[] = [];

  for (const day of eachDayOfInterval({ start: minDate, end: maxDate })) {
    const isFreeDay = isWeekend(day) || freeDays.has(day.toDateString());

    if (isFreeDay) {
      currentStreak.push(day);
    } else {
      if (currentStreak.length >= 3) {
        const hasWeekend = currentStreak.some((d) => isWeekend(d));
        const hasPtoOrHoliday = currentStreak.some((d) => freeDays.has(d.toDateString()) && !isWeekend(d));
        if (hasWeekend && hasPtoOrHoliday) {
          longWeekends++;
        }
      }
      currentStreak = [];
    }
  }

  if (currentStreak.length >= 3) {
    const hasWeekend = currentStreak.some((d) => isWeekend(d));
    const hasPtoOrHoliday = currentStreak.some((d) => freeDays.has(d.toDateString()) && !isWeekend(d));
    if (hasWeekend && hasPtoOrHoliday) {
      longWeekends++;
    }
  }

  return longWeekends;
};

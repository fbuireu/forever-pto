export function getMonthlyDist(days: Date[]) {
  const monthlyDist = new Array(12).fill(0);
  days.forEach((date) => {
    monthlyDist[getMonth(date)]++;
  });
  return monthlyDist;
}

export function getLongBlocksPerQuarter(days: Date[]) {
  const longBlocksPerQuarter = [0, 0, 0, 0];
  const sorted = days.toSorted((a, b) => a.getTime() - b.getTime());
  let currentBlock: Date[] = [];
  let lastQuarter = null;
  for (const date of sorted) {
    const quarter = Math.floor(getMonth(date) / 3);
    const lastInBlock = currentBlock.at(-1);
    if (lastInBlock === undefined || differenceInDays(date, lastInBlock) === 1) {
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

export function getTotalEffectiveDays(days: Date[], bridges?: { effectiveDays: number; ptoDays: Date[] }[]) {
  if (!bridges || bridges.length === 0) {
    return days.length;
  }

  const daysSet = new Set(days.map((d) => d.toDateString()));

  const validBridges = bridges.filter((bridge) => bridge.ptoDays.every((ptoDay) => daysSet.has(ptoDay.toDateString())));

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
import {
  addDays,
  differenceInDays,
  eachDayOfInterval,
  endOfYear,
  formatDate,
  getMonth,
  isWeekend,
  startOfToday,
  startOfYear,
} from '@application/shared/utils/dates';
import type { Locale } from 'next-intl';

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

interface CalculateMaxWorkingPeriodParams {
  ptoDays: Date[];
  holidays: HolidayDTO[];
  year: number;
  allowPastDays: boolean;
}

export const calculateMaxWorkingPeriod = ({
  ptoDays,
  holidays,
  year,
  allowPastDays,
}: CalculateMaxWorkingPeriodParams) => {
  const yearStart = allowPastDays ? startOfYear(new Date(year, 0, 1)) : startOfToday();
  const yearEnd = endOfYear(new Date(year, 11, 31));
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

interface GetWorkingDaysPerWeekParams {
  ptoDays: Date[];
  year: number;
  holidays: HolidayDTO[];
}

export const getWorkingDaysPerMonth = ({ ptoDays, holidays, year }: GetWorkingDaysPerWeekParams) => {
  const yearStart = startOfYear(new Date(year, 0, 1));
  const yearEnd = endOfYear(new Date(year, 11, 31));
  const allDaysInYear = eachDayOfInterval({ start: yearStart, end: yearEnd });
  const workingDaysInYear = allDaysInYear.filter((day) => !isWeekend(day)).length;
  const holidaysOnWorkdays = holidays.filter((h) => !isWeekend(h.date)).length;
  const ptoOnWorkdays = ptoDays.filter((d) => !isWeekend(d)).length;
  const actualWorkingDays = workingDaysInYear - holidaysOnWorkdays - ptoOnWorkdays;
  const avgPerMonth = actualWorkingDays / 12;

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

  let maxStreak = 0;
  let currentStreak = 0;

  for (const day of eachDayOfInterval({ start: minDate, end: maxDate })) {
    const isFreeDay = isWeekend(day) || freeDays.has(day.toDateString());

    if (isFreeDay) {
      currentStreak++;
      maxStreak = Math.max(maxStreak, currentStreak);
    } else {
      currentStreak = 0;
    }
  }

  return maxStreak;
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

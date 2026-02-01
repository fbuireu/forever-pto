import type { Holiday } from '@domain/calendar/models/types';
import { getLocalizedDateFns } from '@domain/shared/utils/localize';
import type { Day } from 'date-fns';
import {
  addDays,
  addMonths,
  eachDayOfInterval,
  eachWeekendOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  getWeek,
  isSameDay,
  isWeekend,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import type { Locale } from 'next-intl';
import type { FromTo } from '../core/Calendar';

const CALENDAR_WEEKS = 6;
const DAYS_PER_WEEK = 7;
const CALENDAR_SIZE = CALENDAR_WEEKS * DAYS_PER_WEEK;

interface GetWeekdayNamesParams {
  locale: Locale;
  weekStartsOn: Day;
}

export const getWeekdayNames = ({ locale, weekStartsOn }: GetWeekdayNamesParams): string[] => {
  const monday = new Date(2023, 0, 2);
  const weekStart = startOfWeek(monday, { weekStartsOn });

  const days: string[] = [];

  for (let i = 0; i < DAYS_PER_WEEK; i++) {
    const day = addDays(weekStart, i);
    days.push(format(day, 'EE', { locale: getLocalizedDateFns(locale) }));
  }

  return days;
};

interface GetDayLabelParams {
  holidays: Holiday[];
  date: Date;
}

export const getDayLabel = ({ holidays, date }: GetDayLabelParams): string | undefined =>
  holidays.find((holiday) => isSameDay(date, holiday.date))?.name;

interface GetTotalMonthsParams {
  carryOverMonths: number;
  year: string;
}
export const getTotalMonths = ({ carryOverMonths, year }: GetTotalMonthsParams) => {
  const totalMonths = 12 + carryOverMonths;
  const start = startOfMonth(new Date(Number(year), 0, 1));

  return Array.from({ length: totalMonths }, (_, i) => addMonths(start, i));
};

interface GetCalendarDaysParams {
  month: Date;
  weekStartsOn: Day;
  fixedWeeks: boolean;
}

export const getCalendarDays = ({ month, weekStartsOn, fixedWeeks }: GetCalendarDaysParams) => {
  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(month);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn });

  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  if (fixedWeeks && days.length < CALENDAR_SIZE) {
    const additionalDays = CALENDAR_SIZE - days.length;

    const lastDay = days[days.length - 1];
    for (let i = 1; i <= additionalDays; i++) {
      const nextDay = addDays(lastDay, i);
      days.push(nextDay);
    }
  }

  return days;
};

export function calculateWorkdays(range: FromTo, holidays: Holiday[]): number {
  const days = eachDayOfInterval({
    start: range.from,
    end: range.to,
  });

  return days.filter((day) => {
    if (isWeekend(day)) return false;

    const isHoliday = holidays.some((holiday) => holiday.date.toDateString() === day.toDateString());
    if (isHoliday) return false;

    return true;
  }).length;
}

export function calculateWeekends(range: FromTo): number {
  const weekendDays = eachWeekendOfInterval({
    start: range.from,
    end: range.to,
  });

  return new Set(weekendDays.map((day) => getWeek(day))).size;
}

export function calculateHolidaysInRange(range: FromTo, holidays: Holiday[]): number {
  const days = eachDayOfInterval({
    start: range.from,
    end: range.to,
  });

  return days.filter((day) => {
    if (isWeekend(day)) return false;
    return holidays.some((holiday) => holiday.date.toDateString() === day.toDateString());
  }).length;
}

interface GetMonthsParamsNames {
  locale: string;
  monthCount: number;
  startYear: number;
  monthOutputFormat?: 'short' | 'long';
}

export const getMonthNames = ({
  locale,
  monthCount,
  startYear,
  monthOutputFormat = 'short',
}: GetMonthsParamsNames): string[] => {
  const monthNames: string[] = [];
  for (let i = 0; i < monthCount; i++) {
    const year = startYear + Math.floor(i / 12);
    const month = i % 12;
    const date = new Date(year, month, 1);

    const monthName = date.toLocaleDateString(locale, { month: monthOutputFormat });
    const yearSuffix = i >= 12 ? ` '${year.toString().slice(-2)}` : '';

    monthNames.push(`${monthName}${yearSuffix}`);
  }

  return monthNames;
};

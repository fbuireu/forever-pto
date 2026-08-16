import type { HolidayDTO } from '@application/dto/holiday/types';
import {
  addDays,
  addMonths,
  type Day,
  eachDayOfInterval,
  eachWeekendOfInterval,
  endOfMonth,
  endOfWeek,
  formatDate,
  isWeekend,
  startOfMonth,
  startOfWeek,
} from '@application/shared/utils/dates';
import type { FromTo } from '../calendar/Calendar';

const CALENDAR_WEEKS = 6;
const DAYS_PER_WEEK = 7;
const CALENDAR_SIZE = CALENDAR_WEEKS * DAYS_PER_WEEK;

export const MONTHS_IN_YEAR = 12;

interface GetTotalMonthsParams {
  carryOverMonths: number;
  year: number;
}
export const getTotalMonths = ({ carryOverMonths, year }: GetTotalMonthsParams) => {
  const totalMonths = MONTHS_IN_YEAR + carryOverMonths;
  const start = startOfMonth(new Date(year, 0, 1));

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

export function calculateWorkdays(range: FromTo, holidays: HolidayDTO[]) {
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

export function calculateWeekends(range: FromTo) {
  const weekendDays = eachWeekendOfInterval({
    start: range.from,
    end: range.to,
  });

  return weekendDays.length;
}

export function calculateHolidaysInRange(range: FromTo, holidays: HolidayDTO[]) {
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

export const getMonthNames = ({ locale, monthCount, startYear, monthOutputFormat = 'short' }: GetMonthsParamsNames) => {
  const monthNames: string[] = [];
  const format = monthOutputFormat === 'long' ? 'MMMM' : 'MMM';
  for (let i = 0; i < monthCount; i++) {
    const year = startYear + Math.floor(i / MONTHS_IN_YEAR);
    const month = i % MONTHS_IN_YEAR;
    const date = new Date(year, month, 1);
    const monthName = formatDate({ date, locale, format });
    const yearSuffix = i >= MONTHS_IN_YEAR ? ` '${year.toString().slice(-2)}` : '';
    monthNames.push(`${monthName}${yearSuffix}`);
  }
  return monthNames;
};

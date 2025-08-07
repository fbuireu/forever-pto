import { HolidayDTO } from '@application/dto/holiday/types';
import {
  addDays,
  addMonths,
  Day,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import { type Locale as DateFnsLocale } from 'date-fns/locale';
import { Locale } from 'next-intl';

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
    days.push(format(day, 'EE', { locale: locale as unknown as DateFnsLocale }));
  }

  return days;
};

interface GetDayLabelParams {
  holidays: HolidayDTO[];
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

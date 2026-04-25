export type Day = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export const ensureDate = (date: Date | string): Date => {
  if (typeof date === 'string') return new Date(date);
  return date instanceof Date ? date : new Date(date);
};

const MS_PER_DAY = 86_400_000;

export const isSameDay = (a: Date, b: Date): boolean =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

export const isSameMonth = (a: Date, b: Date): boolean =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();

export const isBefore = (date: Date, dateToCompare: Date): boolean => date.getTime() < dateToCompare.getTime();

export const compareAsc = (a: Date, b: Date): number => a.getTime() - b.getTime();

export const isWithinInterval = (date: Date, { start, end }: { start: Date; end: Date }): boolean =>
  date.getTime() >= start.getTime() && date.getTime() <= end.getTime();

export const isWeekend = (date: Date): boolean => {
  const d = date.getDay();
  return d === 0 || d === 6;
};

export const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

export const addMonths = (date: Date, months: number): Date => {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
};

export const subMonths = (date: Date, months: number): Date => addMonths(date, -months);

export const differenceInDays = (dateLeft: Date, dateRight: Date): number =>
  Math.round((dateLeft.getTime() - dateRight.getTime()) / MS_PER_DAY);

export const differenceInCalendarDays = (dateLeft: Date, dateRight: Date): number => {
  const left = startOfDay(dateLeft);
  const right = startOfDay(dateRight);
  return Math.round((left.getTime() - right.getTime()) / MS_PER_DAY);
};

export const startOfDay = (date: Date): Date => {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
};

export const startOfToday = (): Date => startOfDay(new Date());

export const startOfYear = (date: Date): Date => new Date(date.getFullYear(), 0, 1);

export const endOfYear = (date: Date): Date => new Date(date.getFullYear(), 11, 31, 23, 59, 59, 999);

export const startOfMonth = (date: Date): Date => new Date(date.getFullYear(), date.getMonth(), 1);

export const endOfMonth = (date: Date): Date => new Date(date.getFullYear(), date.getMonth() + 1, 0);

export const startOfWeek = (date: Date, options?: { weekStartsOn?: Day }): Date => {
  const weekStartsOn = options?.weekStartsOn ?? 0;
  const result = new Date(date);
  const day = result.getDay();
  const diff = (day < weekStartsOn ? 7 : 0) + day - weekStartsOn;
  result.setDate(result.getDate() - diff);
  result.setHours(0, 0, 0, 0);
  return result;
};

export const endOfWeek = (date: Date, options?: { weekStartsOn?: Day }): Date => {
  const weekStartsOn = options?.weekStartsOn ?? 0;
  const result = new Date(date);
  const day = result.getDay();
  const diff = 6 - ((7 + day - weekStartsOn) % 7);
  result.setDate(result.getDate() + diff);
  result.setHours(23, 59, 59, 999);
  return result;
};

export const eachDayOfInterval = ({ start, end }: { start: Date; end: Date }): Date[] => {
  const days: Date[] = [];
  const current = startOfDay(start);
  const endTime = startOfDay(end).getTime();
  while (current.getTime() <= endTime) {
    days.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }
  return days;
};

export const eachWeekendOfInterval = (interval: { start: Date; end: Date }): Date[] =>
  eachDayOfInterval(interval).filter(isWeekend);

export const getMonth = (date: Date): number => date.getMonth();

const pad = (n: number, len = 2): string => String(n).padStart(len, '0');

const isoDate = (date: Date): string => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

const isoDateTime = (date: Date): string =>
  `${isoDate(date)} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;

const INTL_FORMAT_MAP: Record<string, Intl.DateTimeFormatOptions> = {
  yyyy: { year: 'numeric' },
  MMMM: { month: 'long' },
  'LLLL yyyy': { month: 'long', year: 'numeric' },
  'MMM d': { month: 'short', day: 'numeric' },
  'MMM d, yyyy': { month: 'short', day: 'numeric', year: 'numeric' },
  'MMMM d, yyyy': { month: 'long', day: 'numeric', year: 'numeric' },
  'EEEE, MMMM d, yyyy': { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' },
  EEEE: { weekday: 'long' },
  EE: { weekday: 'short' },
  d: { day: 'numeric' },
};

export interface FormatDateParams {
  date: Date;
  locale: string;
  format: string;
}

export const formatDate = ({ date, locale, format }: FormatDateParams): string => {
  if (format === 'yyyy-MM-dd') return isoDate(date);
  if (format === 'yyyy-MM-dd HH:mm:ss') return isoDateTime(date);

  const options = INTL_FORMAT_MAP[format];
  if (options) return new Intl.DateTimeFormat(locale, options).format(date);

  return date.toLocaleDateString(locale);
};

export interface GetWeekdayNamesParams {
  locale: string;
  weekStartsOn?: Day;
  format?: 'narrow' | 'short' | 'long';
}

export const getWeekdayNames = ({
  locale,
  weekStartsOn = 0,
  format = 'short',
}: GetWeekdayNamesParams): string[] => {
  const anchor = new Date(2023, 0, 2);
  const weekStart = startOfWeek(anchor, { weekStartsOn });
  const fmt = new Intl.DateTimeFormat(locale, { weekday: format });
  return Array.from({ length: 7 }, (_, i) => fmt.format(addDays(weekStart, i)));
};

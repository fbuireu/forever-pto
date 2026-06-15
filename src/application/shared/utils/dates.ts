import { Temporal } from 'temporal-polyfill';

export type Day = 0 | 1 | 2 | 3 | 4 | 5 | 6;

const toPlainDate = (date: Date): Temporal.PlainDate =>
  Temporal.PlainDate.from({ year: date.getFullYear(), month: date.getMonth() + 1, day: date.getDate() });

const toDate = (pd: Temporal.PlainDate): Date => new Date(pd.year, pd.month - 1, pd.day);

export const ensureDate = (date: Date | string): Date => {
  if (typeof date === 'string') return new Date(date);
  return date instanceof Date ? date : new Date(date);
};

export const isSameDay = (a: Date, b: Date): boolean => toPlainDate(a).equals(toPlainDate(b));

export const isSameMonth = (a: Date, b: Date): boolean => {
  const pa = toPlainDate(a);
  const pb = toPlainDate(b);
  return pa.year === pb.year && pa.month === pb.month;
};

export const isBefore = (date: Date, dateToCompare: Date): boolean =>
  Temporal.PlainDate.compare(toPlainDate(date), toPlainDate(dateToCompare)) < 0;

export const compareAsc = (a: Date, b: Date): number => Temporal.PlainDate.compare(toPlainDate(a), toPlainDate(b));

export const isWithinInterval = (date: Date, { start, end }: { start: Date; end: Date }): boolean => {
  const pd = toPlainDate(date);
  return (
    Temporal.PlainDate.compare(pd, toPlainDate(start)) >= 0 && Temporal.PlainDate.compare(pd, toPlainDate(end)) <= 0
  );
};

interface IsInSelectedRangeParams {
  date: Date;
  rangeStart: Date;
  rangeEnd: Date;
}

export const isInSelectedRange = ({ date, rangeStart, rangeEnd }: IsInSelectedRangeParams): boolean =>
  isWithinInterval(date, { start: rangeStart, end: rangeEnd });

export const isWeekend = (date: Date): boolean => {
  const { dayOfWeek } = toPlainDate(date);
  return dayOfWeek === 6 || dayOfWeek === 7; // ISO: 6=Sat, 7=Sun
};

export const addDays = (date: Date, days: number): Date => toDate(toPlainDate(date).add({ days }));

export const addMonths = (date: Date, months: number): Date => toDate(toPlainDate(date).add({ months }));

export const subMonths = (date: Date, months: number): Date => toDate(toPlainDate(date).subtract({ months }));

export const differenceInDays = (dateLeft: Date, dateRight: Date): number =>
  toPlainDate(dateRight).until(toPlainDate(dateLeft), { largestUnit: 'days' }).days;

export const differenceInCalendarDays = (dateLeft: Date, dateRight: Date): number =>
  toPlainDate(dateRight).until(toPlainDate(dateLeft), { largestUnit: 'days' }).days;

export const startOfDay = (date: Date): Date => toDate(toPlainDate(date));

export const startOfToday = (): Date => toDate(Temporal.Now.plainDateISO());

export const toIcsDate = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}${m}${d}`;
};

export const startOfYear = (date: Date): Date => toDate(toPlainDate(date).with({ month: 1, day: 1 }));

export const endOfYear = (date: Date): Date => toDate(toPlainDate(date).with({ month: 12, day: 31 }));

export const startOfMonth = (date: Date): Date => toDate(toPlainDate(date).with({ day: 1 }));

export const endOfMonth = (date: Date): Date => {
  const pd = toPlainDate(date);
  return toDate(pd.with({ day: pd.daysInMonth }));
};

export const startOfWeek = (date: Date, options?: { weekStartsOn?: Day }): Date => {
  const pd = toPlainDate(date);
  const startDay = options?.weekStartsOn || 7; // 0 (Sun) → 7, 1–6 unchanged (ISO dayOfWeek)
  const diff = (pd.dayOfWeek - startDay + 7) % 7;
  return toDate(pd.subtract({ days: diff }));
};

export const endOfWeek = (date: Date, options?: { weekStartsOn?: Day }): Date => {
  const pd = toPlainDate(date);
  const startDay = options?.weekStartsOn || 7;
  const diff = (pd.dayOfWeek - startDay + 7) % 7;
  return toDate(pd.subtract({ days: diff }).add({ days: 6 }));
};

export const eachDayOfInterval = ({ start, end }: { start: Date; end: Date }): Date[] => {
  const days: Date[] = [];
  let current = toPlainDate(start);
  const endPd = toPlainDate(end);
  while (Temporal.PlainDate.compare(current, endPd) <= 0) {
    days.push(toDate(current));
    current = current.add({ days: 1 });
  }
  return days;
};

export const eachWeekendOfInterval = (interval: { start: Date; end: Date }): Date[] =>
  eachDayOfInterval(interval).filter(isWeekend);

export const getMonth = (date: Date): number => toPlainDate(date).month - 1;

export const getYear = (date: Date): number => toPlainDate(date).year;

export const getDayOfMonth = (date: Date): number => toPlainDate(date).day;

const isoDate = (date: Date) => {
  const pd = toPlainDate(date);
  return `${pd.year}-${String(pd.month).padStart(2, '0')}-${String(pd.day).padStart(2, '0')}`;
};

const isoDateTime = (date: Date) => {
  const base = isoDate(date);
  const h = String(date.getHours()).padStart(2, '0');
  const m = String(date.getMinutes()).padStart(2, '0');
  const s = String(date.getSeconds()).padStart(2, '0');
  return `${base} ${h}:${m}:${s}`;
};

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

const dateFormatCache = new Map<string, Intl.DateTimeFormat>();

export const formatDate = ({ date, locale, format }: FormatDateParams): string => {
  if (format === 'yyyy-MM-dd') return isoDate(date);
  if (format === 'yyyy-MM-dd HH:mm:ss') return isoDateTime(date);

  const options = INTL_FORMAT_MAP[format];
  if (options) {
    const key = `${locale}-${format}`;
    let fmt = dateFormatCache.get(key);
    if (!fmt) {
      fmt = new Intl.DateTimeFormat(locale, options);
      dateFormatCache.set(key, fmt);
    }
    return fmt.format(date);
  }

  return date.toLocaleDateString(locale);
};

export interface GetWeekdayNamesParams {
  locale: string;
  weekStartsOn?: Day;
  format?: 'narrow' | 'short' | 'long';
}

const weekdayFmtCache = new Map<string, Intl.DateTimeFormat>();

export const getWeekdayNames = ({ locale, weekStartsOn = 0, format = 'short' }: GetWeekdayNamesParams): string[] => {
  const anchor = new Date(2023, 0, 2); // known Monday
  const weekStart = startOfWeek(anchor, { weekStartsOn });
  const key = `${locale}-${weekStartsOn}-${format}`;
  let fmt = weekdayFmtCache.get(key);
  if (!fmt) {
    fmt = new Intl.DateTimeFormat(locale, { weekday: format });
    weekdayFmtCache.set(key, fmt);
  }
  return Array.from({ length: 7 }, (_, i) => fmt.format(addDays(weekStart, i)));
};

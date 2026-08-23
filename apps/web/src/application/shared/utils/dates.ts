import { Temporal } from "temporal-polyfill";

export type Day = 0 | 1 | 2 | 3 | 4 | 5 | 6;

const toPlainDate = (date: Date): Temporal.PlainDate =>
	Temporal.PlainDate.from({ year: date.getFullYear(), month: date.getMonth() + 1, day: date.getDate() });

const toDate = (pd: Temporal.PlainDate): Date => new Date(pd.year, pd.month - 1, pd.day);

export interface DatePairParams {
	a: Date;
	b: Date;
}

export const isSameDay = ({ a, b }: DatePairParams): boolean => toPlainDate(a).equals(toPlainDate(b));

export const isSameMonth = ({ a, b }: DatePairParams): boolean => {
	const pa = toPlainDate(a);
	const pb = toPlainDate(b);
	return pa.year === pb.year && pa.month === pb.month;
};

export interface IsBeforeParams {
	date: Date;
	dateToCompare: Date;
}

export const isBefore = ({ date, dateToCompare }: IsBeforeParams): boolean =>
	Temporal.PlainDate.compare(toPlainDate(date), toPlainDate(dateToCompare)) < 0;

export const compareAsc = ({ a, b }: DatePairParams): number =>
	Temporal.PlainDate.compare(toPlainDate(a), toPlainDate(b));

export interface IsWithinIntervalParams {
	date: Date;
	start: Date;
	end: Date;
}

export const isWithinInterval = ({ date, start, end }: IsWithinIntervalParams): boolean => {
	const pd = toPlainDate(date);
	return (
		Temporal.PlainDate.compare(pd, toPlainDate(start)) >= 0 && Temporal.PlainDate.compare(pd, toPlainDate(end)) <= 0
	);
};

export const isWeekend = (date: Date): boolean => {
	const { dayOfWeek } = toPlainDate(date);
	return dayOfWeek === 6 || dayOfWeek === 7;
};

export interface AddDaysParams {
	date: Date;
	days: number;
}

export const addDays = ({ date, days }: AddDaysParams): Date => toDate(toPlainDate(date).add({ days }));

export interface MonthShiftParams {
	date: Date;
	months: number;
}

export const addMonths = ({ date, months }: MonthShiftParams): Date => toDate(toPlainDate(date).add({ months }));

export const subMonths = ({ date, months }: MonthShiftParams): Date => toDate(toPlainDate(date).subtract({ months }));

export interface DifferenceInDaysParams {
	dateLeft: Date;
	dateRight: Date;
}

export const differenceInDays = ({ dateLeft, dateRight }: DifferenceInDaysParams): number =>
	toPlainDate(dateRight).until(toPlainDate(dateLeft), { largestUnit: "days" }).days;

export const startOfDay = (date: Date): Date => toDate(toPlainDate(date));

export const startOfToday = (): Date => toDate(Temporal.Now.plainDateISO());

export const startOfYear = (date: Date): Date => toDate(toPlainDate(date).with({ month: 1, day: 1 }));

export const endOfYear = (date: Date): Date => toDate(toPlainDate(date).with({ month: 12, day: 31 }));

export const startOfMonth = (date: Date): Date => toDate(toPlainDate(date).with({ day: 1 }));

export const endOfMonth = (date: Date): Date => {
	const pd = toPlainDate(date);
	return toDate(pd.with({ day: pd.daysInMonth }));
};

export const startOfWeek = (date: Date, options?: { weekStartsOn?: Day }): Date => {
	const pd = toPlainDate(date);
	const startDay = options?.weekStartsOn || 7;
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
	return `${pd.year}-${String(pd.month).padStart(2, "0")}-${String(pd.day).padStart(2, "0")}`;
};

export const isoDateTime = (date: Date) => {
	const base = isoDate(date);
	const h = String(date.getHours()).padStart(2, "0");
	const m = String(date.getMinutes()).padStart(2, "0");
	const s = String(date.getSeconds()).padStart(2, "0");
	return `${base} ${h}:${m}:${s}`;
};

const INTL_FORMAT_MAP = {
	yyyy: { year: "numeric" },
	MMM: { month: "short" },
	MMMM: { month: "long" },
	"LLLL yyyy": { month: "long", year: "numeric" },
	"MMM d": { month: "short", day: "numeric" },
	"MMM d, yyyy": { month: "short", day: "numeric", year: "numeric" },
	"MMMM d, yyyy": { month: "long", day: "numeric", year: "numeric" },
	"EE, MMM d": { weekday: "short", day: "numeric", month: "short" },
	"EEEE, MMMM d, yyyy": { weekday: "long", month: "long", day: "numeric", year: "numeric" },
	EEEE: { weekday: "long" },
	EE: { weekday: "short" },
	EEEEE: { weekday: "narrow" },
	d: { day: "numeric" },
} satisfies Record<string, Intl.DateTimeFormatOptions>;

const ISO_DATE = "yyyy-MM-dd";
const ISO_DATE_TIME = "yyyy-MM-dd HH:mm:ss";

export type DateFormat = keyof typeof INTL_FORMAT_MAP | typeof ISO_DATE | typeof ISO_DATE_TIME;

export interface FormatDateParams {
	date: Date;
	locale: string;
	format: DateFormat;
}

const dateFormatCache = new Map<string, Intl.DateTimeFormat>();

export const formatDate = ({ date, locale, format }: FormatDateParams): string => {
	if (format === ISO_DATE) return isoDate(date);
	if (format === ISO_DATE_TIME) return isoDateTime(date);

	const key = `${locale}-${format}`;
	let fmt = dateFormatCache.get(key);
	if (!fmt) {
		fmt = new Intl.DateTimeFormat(locale, INTL_FORMAT_MAP[format]);
		dateFormatCache.set(key, fmt);
	}

	return fmt.format(date);
};

const WEEKDAY_FORMAT = {
	narrow: "EEEEE",
	short: "EE",
	long: "EEEE",
} satisfies Record<string, DateFormat>;

export interface GetWeekdayNamesParams {
	locale: string;
	weekStartsOn?: Day;
	format?: keyof typeof WEEKDAY_FORMAT;
}

export const getWeekdayNames = ({ locale, weekStartsOn = 0, format = "short" }: GetWeekdayNamesParams): string[] => {
	const anchor = new Date(2023, 0, 2);
	const weekStart = startOfWeek(anchor, { weekStartsOn });

	return Array.from({ length: 7 }, (_, i) =>
		formatDate({ date: addDays({ date: weekStart, days: i }), locale, format: WEEKDAY_FORMAT[format] }),
	);
};

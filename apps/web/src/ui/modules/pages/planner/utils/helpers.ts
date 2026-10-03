import type { HolidayDTO } from "@application/dto/holiday/types";
import {
	addDays,
	type Day,
	eachDayOfInterval,
	eachWeekendOfInterval,
	endOfMonth,
	endOfWeek,
	getMonthNames,
	isWeekend,
	startOfMonth,
	startOfWeek,
} from "@application/shared/utils/dates";
import { MONTHS_IN_YEAR } from "@domain/calendar/window";
import type { FromTo } from "../calendar/Calendar";

export const EFFICIENCY_FORMAT = { minimumFractionDigits: 1, maximumFractionDigits: 1 } as const;

const CALENDAR_WEEKS = 6;
const DAYS_PER_WEEK = 7;
const CALENDAR_SIZE = CALENDAR_WEEKS * DAYS_PER_WEEK;

interface GetCalendarDaysParams {
	month: Date;
	weekStartsOn: Day;
	fixedWeeks: boolean;
}

export const getCalendarDays = ({ month, weekStartsOn, fixedWeeks }: GetCalendarDaysParams) => {
	const monthStart = startOfMonth(month);
	const monthEnd = endOfMonth(month);
	const calendarStart = startOfWeek({ date: monthStart, options: { weekStartsOn } });
	const calendarEnd = endOfWeek({ date: monthEnd, options: { weekStartsOn } });

	const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

	if (fixedWeeks && days.length < CALENDAR_SIZE) {
		const additionalDays = CALENDAR_SIZE - days.length;

		const lastDay = days[days.length - 1];
		for (let i = 1; i <= additionalDays; i++) {
			const nextDay = addDays({ date: lastDay, days: i });
			days.push(nextDay);
		}
	}

	return days;
};

export interface DateRangeCountParams {
	range: FromTo;
	holidays: HolidayDTO[];
}

export function calculateWorkdays({ range, holidays }: DateRangeCountParams) {
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

export function calculateHolidaysInRange({ range, holidays }: DateRangeCountParams) {
	const days = eachDayOfInterval({
		start: range.from,
		end: range.to,
	});

	return days.filter((day) => {
		if (isWeekend(day)) return false;
		return holidays.some((holiday) => holiday.date.toDateString() === day.toDateString());
	}).length;
}

interface GetWindowMonthLabelsParams {
	locale: string;
	monthCount: number;
	startYear: number;
}

export const getWindowMonthLabels = ({ locale, monthCount, startYear }: GetWindowMonthLabelsParams) => {
	const names = getMonthNames({ locale });

	return Array.from({ length: monthCount }, (_, index) => {
		const year = startYear + Math.floor(index / MONTHS_IN_YEAR);
		const yearSuffix = index >= MONTHS_IN_YEAR ? ` '${year.toString().slice(-2)}` : "";
		return `${names[index % MONTHS_IN_YEAR]}${yearSuffix}`;
	});
};

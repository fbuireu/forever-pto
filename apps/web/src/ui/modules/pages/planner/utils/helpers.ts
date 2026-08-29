import type { HolidayDTO } from "@application/dto/holiday/types";
import {
	addDays,
	type Day,
	eachDayOfInterval,
	eachWeekendOfInterval,
	endOfMonth,
	endOfWeek,
	formatDate,
	isWeekend,
	startOfMonth,
	startOfWeek,
} from "@application/shared/utils/dates";
import { MONTHS_IN_YEAR } from "@domain/calendar/window";
import type { FromTo } from "../calendar/Calendar";

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

interface GetMonthsParamsNames {
	locale: string;
	monthCount: number;
	startYear: number;
	monthOutputFormat?: "short" | "long";
}

export const getMonthNames = ({ locale, monthCount, startYear, monthOutputFormat = "short" }: GetMonthsParamsNames) => {
	const monthNames: string[] = [];
	const format = monthOutputFormat === "long" ? "MMMM" : "MMM";
	for (let i = 0; i < monthCount; i++) {
		const year = startYear + Math.floor(i / MONTHS_IN_YEAR);
		const month = i % MONTHS_IN_YEAR;
		const date = new Date(year, month, 1);
		const monthName = formatDate({ date, locale, format });
		const yearSuffix = i >= MONTHS_IN_YEAR ? ` '${year.toString().slice(-2)}` : "";
		monthNames.push(`${monthName}${yearSuffix}`);
	}
	return monthNames;
};

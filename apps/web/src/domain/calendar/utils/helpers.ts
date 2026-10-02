import type { HolidayDTO } from "@application/dto/holiday/types";
import {
	addDays,
	dayIndex,
	differenceInDays,
	fromDayIndex,
	isWeekend,
	isWeekendIndex,
	startOfToday,
} from "@application/shared/utils/dates";
import { PTO_CONSTANTS } from "@domain/calendar/const";
import type { Bridge } from "@domain/calendar/types";
import { Temporal } from "temporal-polyfill";
import { createHolidaySet, getKey } from "./cache";
import { spanLength } from "./spans";

interface ExpandThroughFreeDaysParams {
	first: Date;
	last: Date;
	holidaySet: Set<string>;
}

interface IsFreeDayParams {
	date: Date;
	holidaySet: Set<string>;
}

const isFreeDay = ({ date, holidaySet }: IsFreeDayParams) => isWeekend(date) || holidaySet.has(getKey(date));

const expandThroughFreeDays = ({ first, last, holidaySet }: ExpandThroughFreeDaysParams) => {
	let start = first;
	let end = last;

	let current = addDays({ date: first, days: -1 });
	for (let steps = 0; isFreeDay({ date: current, holidaySet }) && steps < PTO_CONSTANTS.SAFETY_LIMIT; steps++) {
		start = current;
		current = addDays({ date: current, days: -1 });
	}

	current = addDays({ date: last, days: 1 });
	for (let steps = 0; isFreeDay({ date: current, holidaySet }) && steps < PTO_CONSTANTS.SAFETY_LIMIT; steps++) {
		end = current;
		current = addDays({ date: current, days: 1 });
	}

	return { start, end };
};

export interface CompareByEfficiencyParams {
	a: Bridge;
	b: Bridge;
}

export const compareByEfficiency = ({ a, b }: CompareByEfficiencyParams) => {
	const difference = b.efficiency - a.efficiency;

	if (Math.abs(difference) > PTO_CONSTANTS.BRIDGE_GENERATION.EFFICIENCY_COMPARISON_THRESHOLD) {
		return difference;
	}

	return b.effectiveDays - a.effectiveDays;
};

interface GetAvailableWorkdaysParams {
	months: Date[];
	holidays: HolidayDTO[];
	allowPastDays: boolean;
	removedDays?: Date[];
}

export function getAvailableWorkdays({
	months,
	holidays,
	allowPastDays,
	removedDays = [],
}: GetAvailableWorkdaysParams) {
	const todayTime = startOfToday().getTime();

	const holidaySet = createHolidaySet(holidays);
	const removedSet = new Set(removedDays.map((day) => getKey(day)));
	const workdays: Date[] = [];

	for (const month of months) {
		const year = month.getFullYear();
		const monthNum = month.getMonth();
		const daysInMonth = Temporal.PlainYearMonth.from({ year, month: monthNum + 1 }).daysInMonth;

		for (let day = 1; day <= daysInMonth; day++) {
			const date = new Date(year, monthNum, day);

			if (!allowPastDays && date.getTime() < todayTime) continue;
			if (isWeekend(date)) continue;
			if (holidaySet.has(getKey(date))) continue;
			if (removedSet.has(getKey(date))) continue;

			workdays.push(date);
		}
	}

	return workdays;
}

interface FindBridgesParams {
	availableWorkdays: Date[];
	holidays: HolidayDTO[];
}

interface AnalyzeRunParams {
	first: number;
	days: Date[];
}

export const findBridges = ({ availableWorkdays, holidays }: FindBridgesParams) => {
	if (availableWorkdays.length === 0) return [];
	const { MAX_MULTI_DAY_SIZE, MIN_MULTI_DAY_SIZE } = PTO_CONSTANTS.BRIDGE_SEARCH;
	const { BLOCK_MINIMUM } = PTO_CONSTANTS.EFFICIENCY;

	const holidayDays = new Set(
		[...createHolidaySet(holidays)].map((key) => {
			const [year = 0, month = 0, day = 0] = key.split("-").map(Number);
			return dayIndex(new Date(year, month, day));
		}),
	);
	const isFree = (day: number) => isWeekendIndex(day) || holidayDays.has(day);
	const bridges: Bridge[] = [];

	const sortedWorkdays = availableWorkdays.toSorted((a, b) => a.getTime() - b.getTime());
	const workdayAt = new Map<number, Date>();
	for (const workday of sortedWorkdays) {
		const index = dayIndex(workday);
		if (!workdayAt.has(index)) workdayAt.set(index, workday);
	}

	const analyzeRun = ({ first, days }: AnalyzeRunParams) => {
		const size = days.length;
		const last = first + size - 1;
		let adjacent = false;
		for (let day = first; day <= last && !adjacent; day++) adjacent = isFree(day - 1) || isFree(day + 1);
		if (!adjacent) return;

		let start = first;
		for (let steps = 0; isFree(start - 1) && steps < PTO_CONSTANTS.SAFETY_LIMIT; steps++) start--;
		let end = last;
		for (let steps = 0; isFree(end + 1) && steps < PTO_CONSTANTS.SAFETY_LIMIT; steps++) end++;

		const effectiveDays = spanLength({ start, end });
		const efficiency = effectiveDays / size;
		if (efficiency < BLOCK_MINIMUM) return;

		bridges.push({
			startDate: start === first ? (days[0] as Date) : fromDayIndex(start),
			endDate: end === last ? (days[size - 1] as Date) : fromDayIndex(end),
			ptoDaysNeeded: size,
			effectiveDays,
			efficiency,
			ptoDays: [...days],
		});
	};

	for (const workday of sortedWorkdays) {
		const first = dayIndex(workday);
		analyzeRun({ first, days: [workday] });

		const run: Date[] = [workday];
		for (let size = MIN_MULTI_DAY_SIZE; size <= MAX_MULTI_DAY_SIZE; size++) {
			while (run.length < size) {
				const next = workdayAt.get(first + run.length);
				if (next === undefined) break;
				run.push(new Date(next.getFullYear(), next.getMonth(), next.getDate()));
			}
			if (run.length < size) break;
			analyzeRun({ first, days: run });
		}
	}

	return bridges.sort((a, b) => compareByEfficiency({ a, b }));
};

interface FreeDaysAroundParams {
	days: Date[];
	holidays: HolidayDTO[];
}

export const freeDaysAround = ({ days, holidays }: FreeDaysAroundParams) => {
	const holidaySet = createHolidaySet(holidays);

	return days.flatMap((day) => {
		const { start, end } = expandThroughFreeDays({ first: day, last: day, holidaySet });
		return Array.from({ length: differenceInDays({ dateLeft: end, dateRight: start }) + 1 }, (_, offset) =>
			addDays({ date: start, days: offset }),
		);
	});
};

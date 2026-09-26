import type { HolidayDTO } from "@application/dto/holiday/types";
import { addDays, differenceInDays, isWeekend, startOfToday } from "@application/shared/utils/dates";
import { Temporal } from "temporal-polyfill";
import { PTO_CONSTANTS } from "../const";
import type { Bridge } from "../types";
import { createHolidaySet, getKey } from "./cache";

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

interface AnalyzePotentialBridgesParams {
	ptoDays: Date[];
	holidaySet: Set<string>;
}

function analyzePotentialBridge({ ptoDays, holidaySet }: AnalyzePotentialBridgesParams) {
	if (ptoDays.length === 0) return null;
	const {
		EFFICIENCY: { BLOCK_MINIMUM },
	} = PTO_CONSTANTS;

	const sortedDays = ptoDays.toSorted((a, b) => a.getTime() - b.getTime());
	const firstDay = sortedDays[0];
	const lastDay = sortedDays[sortedDays.length - 1];

	let hasAdjacentFreeDay = false;

	for (const day of sortedDays) {
		const prevDay = addDays({ date: day, days: -1 });
		const nextDay = addDays({ date: day, days: 1 });

		const prevIsFree = isFreeDay({ date: prevDay, holidaySet });
		const nextIsFree = isFreeDay({ date: nextDay, holidaySet });

		if (prevIsFree || nextIsFree) {
			hasAdjacentFreeDay = true;
			break;
		}
	}

	if (!hasAdjacentFreeDay) {
		return null;
	}

	const { start: effectiveStart, end: effectiveEnd } = expandThroughFreeDays({
		first: firstDay,
		last: lastDay,
		holidaySet,
	});

	const effectiveDays = differenceInDays({ dateLeft: effectiveEnd, dateRight: effectiveStart }) + 1;
	const efficiency = effectiveDays / ptoDays.length;

	if (efficiency >= BLOCK_MINIMUM) {
		return {
			startDate: effectiveStart,
			endDate: effectiveEnd,
			ptoDaysNeeded: ptoDays.length,
			effectiveDays,
			efficiency,
			ptoDays: sortedDays,
		};
	}

	return null;
}

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

export const findBridges = ({ availableWorkdays, holidays }: FindBridgesParams) => {
	if (availableWorkdays.length === 0) return [];
	const { MAX_MULTI_DAY_SIZE, MIN_MULTI_DAY_SIZE } = PTO_CONSTANTS.BRIDGE_SEARCH;

	const holidaySet = createHolidaySet(holidays);
	const bridges: Bridge[] = [];

	const sortedWorkdays = availableWorkdays.toSorted((a, b) => a.getTime() - b.getTime());
	const workdaySet = new Set(sortedWorkdays.map((d) => d.getTime()));

	for (const workday of sortedWorkdays) {
		const singleBridge = analyzePotentialBridge({ ptoDays: [workday], holidaySet });
		if (singleBridge) {
			bridges.push(singleBridge);
		}

		for (let size = MIN_MULTI_DAY_SIZE; size <= MAX_MULTI_DAY_SIZE; size++) {
			const multiDays: Date[] = [workday];

			for (let i = 1; i < size; i++) {
				const nextDay = addDays({ date: workday, days: i });
				if (workdaySet.has(nextDay.getTime())) {
					multiDays.push(nextDay);
				} else {
					break;
				}
			}

			if (multiDays.length === size) {
				const multiBridge = analyzePotentialBridge({ ptoDays: multiDays, holidaySet });
				if (multiBridge) {
					bridges.push(multiBridge);
				}
			}
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

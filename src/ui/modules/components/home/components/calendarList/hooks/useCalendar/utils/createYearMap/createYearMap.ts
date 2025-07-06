import { eachDayOfInterval, endOfMonth, getMonth, isWeekend, startOfMonth } from "date-fns";
import { getDateKey } from "../../../utils/getDateKey/getDateKey";
import type { DayInfo } from "../../types";

interface CreateYearMapParams {
	monthsToShow: Date[];
	isHoliday: (date: Date) => boolean;
	selectedPtoDays: Date[];
	isPastDaysAllowed: () => boolean;
}

interface CreateYearMapReturn {
	map: Map<string, DayInfo>;
	allDays: Date[];
}

export function createYearMap({
	monthsToShow,
	isHoliday,
	selectedPtoDays,
	isPastDaysAllowed,
}: CreateYearMapParams): CreateYearMapReturn {
	const today = new Date();
	today.setHours(0, 0, 0, 0);

	const map = new Map<string, DayInfo>();
	let allDays: Date[] = [];

	for (const month of monthsToShow) {
		const daysInMonth = eachDayOfInterval({
			start: startOfMonth(month),
			end: endOfMonth(month),
		});
		allDays.push(...daysInMonth);
	}

	if (!isPastDaysAllowed()) {
		allDays = allDays.filter((day) => day >= today);
	}

	const selectedPtoDaysSet = new Set(selectedPtoDays.map(getDateKey));

	for (const day of allDays) {
		const dayKey = getDateKey(day);
		const isAlreadySelected = selectedPtoDaysSet.has(dayKey);

		map.set(dayKey, {
			date: day,
			isWeekend: isWeekend(day),
			isHoliday: isHoliday(day),
			isSelected: selectedPtoDaysSet.has(dayKey),
			isFreeDay: isWeekend(day) || isHoliday(day) || isAlreadySelected,
			month: getMonth(day),
		});
	}

	return { map, allDays };
}

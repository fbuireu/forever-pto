import type { HolidayDTO } from "@application/dto/holiday/types";
import { eachDayOfInterval, endOfMonth, isWeekend, startOfMonth } from "date-fns";
import { getDateKey } from "../../../utils/getDateKey/getDateKey";

interface CreateFreeDaysBaseMapParams {
	monthsToShow: Date[];
	holidays: HolidayDTO[];
	selectedPtoDays: Date[];
}

export function createFreeDaysBaseMap({
	monthsToShow,
	holidays,
	selectedPtoDays,
}: CreateFreeDaysBaseMapParams): Map<string, Date> {
	const freeDays = new Map<string, Date>();

	for (const month of monthsToShow) {
		const daysInMonth = eachDayOfInterval({
			start: startOfMonth(month),
			end: endOfMonth(month),
		});

		for (const day of daysInMonth) {
			if (isWeekend(day)) {
				freeDays.set(getDateKey(day), day);
			}
		}
	}

	for (const holiday of holidays) {
		freeDays.set(getDateKey(holiday.date), holiday.date);
	}

	for (const day of selectedPtoDays) {
		freeDays.set(getDateKey(day), day);
	}

	return freeDays;
}

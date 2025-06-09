import type { HolidayDTO } from "@application/dto/holiday/types";
import { getDateKey } from "@modules/components/home/components/calendarList/hooks/utils/getDateKey/getDateKey";
import { eachDayOfInterval, endOfMonth, isWeekend, startOfMonth } from "date-fns";

interface SimplifiedMapsResult {
	holidaysMap: Map<string, HolidayDTO>;
	freeDaysBaseMap: Map<string, Date>;
	isHoliday: (date: Date) => boolean;
}

export function createAllCalendarMaps(
	monthsToShow: Date[],
	holidays: HolidayDTO[],
	selectedPtoDays: Date[],
): SimplifiedMapsResult {
	const holidaysMap = new Map<string, HolidayDTO>();
	const freeDaysBaseMap = new Map<string, Date>();

	for (const holiday of holidays) {
		const holidayKey = getDateKey(holiday.date);
		holidaysMap.set(holidayKey, holiday);

		if (!isWeekend(holiday.date)) {
			freeDaysBaseMap.set(holidayKey, holiday.date);
		}
	}

	for (const month of monthsToShow) {
		const daysInMonth = eachDayOfInterval({
			start: startOfMonth(month),
			end: endOfMonth(month),
		});

		for (const day of daysInMonth) {
			if (isWeekend(day)) {
				freeDaysBaseMap.set(getDateKey(day), day);
			}
		}
	}

	for (const day of selectedPtoDays) {
		freeDaysBaseMap.set(getDateKey(day), day);
	}

	const isHoliday = (date: Date): boolean => holidaysMap.has(getDateKey(date));

	return {
		holidaysMap,
		freeDaysBaseMap,
		isHoliday,
	};
}

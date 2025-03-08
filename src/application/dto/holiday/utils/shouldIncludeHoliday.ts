import type { RawHoliday } from "@/application/dto/holiday/types";

interface ShouldIncludeHolidayParams {
	holiday: RawHoliday;
	year: number;
	monthsToShow: number;
}

export function shouldIncludeHoliday({ holiday, year, monthsToShow }: ShouldIncludeHolidayParams): boolean {
	const date = new Date(holiday.date);
	const holidayYear = date.getFullYear();
	const holidayMonth = date.getMonth();

	if (holidayYear === year) {
		return true;
	}

	if (holidayYear === year + 1) {
		const monthsFromNextYear = monthsToShow - 12;
		return holidayMonth < monthsFromNextYear;
	}

	return false;
}

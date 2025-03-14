import type { RawHoliday } from '@application/dto/holiday/types';

interface ShouldIncludeHolidayParams {
	holiday: RawHoliday;
	year: number;
	carryOverMonths: number;
}

export function shouldIncludeHoliday({ holiday, year, carryOverMonths }: ShouldIncludeHolidayParams): boolean {
	const date = new Date(holiday.date);
	const holidayYear = date.getFullYear();
	const holidayMonth = date.getMonth();

	if (holidayYear === year) {
		return true;
	}

	if (holidayYear === year + 1) {
		const monthsFromNextYear = carryOverMonths - 12;
		return holidayMonth < monthsFromNextYear;
	}

	return false;
}

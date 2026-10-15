import type { HolidayDTO } from "@application/dto/holiday/types";
import { isWeekend } from "@application/shared/utils/dates";

const DATE_KEY_CACHE = new Map<number, string>();
let holidaySetMemo: Set<string> | null = null;

export const clearDateKeyCache = (): void => DATE_KEY_CACHE.clear();
export const clearHolidayCache = (): void => {
	holidaySetMemo = null;
};

export const getKey = (date: Date): string => {
	const time = date.getTime();
	const cached = DATE_KEY_CACHE.get(time);

	if (cached !== undefined) return cached;

	const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
	DATE_KEY_CACHE.set(time, key);
	return key;
};

export const getCombinationKey = (days: Date[]): string => {
	return days
		.map((d) => getKey(d))
		.sort((a, b) => a.localeCompare(b))
		.join(",");
};

export const createHolidaySet = (holidays: HolidayDTO[]): Set<string> => {
	if (holidaySetMemo !== null) return holidaySetMemo;

	holidaySetMemo = new Set(
		holidays.reduce<string[]>((acc, { date }) => {
			if (!isWeekend(date)) acc.push(getKey(date));
			return acc;
		}, []),
	);

	return holidaySetMemo;
};

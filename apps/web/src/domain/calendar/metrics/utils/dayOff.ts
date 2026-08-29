import type { HolidayDTO } from "@application/dto/holiday/types";

interface DayOffKeysParams {
	placedDays: Date[];
	holidays: HolidayDTO[];
}

export const dayKey = (date: Date): string => date.toDateString();

export const dayOffKeys = ({ placedDays, holidays }: DayOffKeysParams): Set<string> =>
	new Set([...placedDays.map(dayKey), ...holidays.map((holiday) => dayKey(holiday.date))]);

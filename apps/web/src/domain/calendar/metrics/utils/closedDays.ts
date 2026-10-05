import type { HolidayDTO } from "@application/dto/holiday/types";

interface ClosedDayKeysParams {
	placedDays: Date[];
	holidays: HolidayDTO[];
}

export const dayKey = (date: Date): string => date.toDateString();

export const closedDayKeys = ({ placedDays, holidays }: ClosedDayKeysParams): Set<string> =>
	new Set([...placedDays.map(dayKey), ...holidays.map((holiday) => dayKey(holiday.date))]);

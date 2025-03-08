import type { RawHoliday } from "@/application/dto/holiday/types";

interface IsInTargetYearParams {
	holiday: RawHoliday;
	targetYears: number[];
}

export function isInTargetYear({ holiday, targetYears }: IsInTargetYearParams) {
	return targetYears.includes(new Date(holiday.date).getFullYear());
}

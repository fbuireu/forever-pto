import type { BlockPosition } from "@modules/components/home/components/calendarList/hooks/useCalendarInfo/types";
import { isSameDay } from "date-fns";

interface DetermineDayPositionParams {
	orderedDays: Date[];
	targetDate: Date;
	compareFn?: (a: Date, b: Date) => boolean;
}

export function determineDayPosition({
	orderedDays,
	targetDate,
	compareFn = isSameDay,
}: DetermineDayPositionParams): BlockPosition {
	if (!orderedDays || orderedDays.length === 0) return null;

	if (orderedDays.length === 1) return "single";

	const index = orderedDays.findIndex((day) => compareFn(day, targetDate));
	if (index < 0) return null;

	if (index === 0) return "start";
	if (index === orderedDays.length - 1) return "end";
	return "middle";
}

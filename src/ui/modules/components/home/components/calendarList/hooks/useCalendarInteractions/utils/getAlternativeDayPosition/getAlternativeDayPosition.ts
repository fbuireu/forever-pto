import type { BlockOpportunity } from "@modules/components/home/components/calendarList/hooks/useCalendar/types";
import type { BlockPosition } from "@modules/components/home/components/calendarList/hooks/useCalendarInfo/types";
import { determineDayPosition } from "@modules/components/home/components/calendarList/hooks/useCalendarInteractions/utils/determineDayPosition/determineDayPosition";
import { findAlternativeBlockContainingDay } from "@modules/components/home/components/calendarList/hooks/useCalendarInteractions/utils/findAlternativeBlockContainingDay/findAlternativeBlockContainingDay";
import { getDateKey } from "@modules/components/home/components/calendarList/hooks/utils/getDateKey/getDateKey";

interface GetAlternativeDayPositionParams {
	date: Date;
	hoveredBlockId: string | null;
	alternativeBlocks: Record<string, BlockOpportunity[]>;
	isDayAlternative: (day: Date) => boolean;
}

export function getAlternativeDayPosition({
	date,
	hoveredBlockId,
	alternativeBlocks,
	isDayAlternative,
}: GetAlternativeDayPositionParams): BlockPosition {
	if (!hoveredBlockId || !isDayAlternative(date)) return null;

	const alternativeBlock = findAlternativeBlockContainingDay({
		day: date,
		hoveredBlockId,
		alternativeBlocks,
	});

	if (!alternativeBlock?.days?.length) return null;

	const blockDays = [...alternativeBlock.days].sort((a, b) => a.getTime() - b.getTime());

	const dateKey = getDateKey(date);
	const compareByKey = (a: Date, b: Date) => getDateKey(a) === dateKey;

	return determineDayPosition({
		orderedDays: blockDays,
		targetDate: date,
		compareFn: compareByKey,
	});
}

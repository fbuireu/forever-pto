import type { BlockOpportunity } from '@modules/components/home/components/calendarList/hooks/useCalendar/types';
import type { BlockPosition } from '@modules/components/home/components/calendarList/hooks/useCalendarInfo/types';
import { findAlternativeBlockContainingDay } from '@modules/components/home/components/calendarList/hooks/useCalendarInteractions/utils/findAlternativeBlockContainingDay/findAlternativeBlockContainingDay';
import { getDateKey } from '@modules/components/home/components/calendarList/hooks/utils/getDateKey/getDateKey';

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

	const alternativeBlock = findAlternativeBlockContainingDay({ day: date, hoveredBlockId, alternativeBlocks });

	if (!alternativeBlock || !alternativeBlock.days || alternativeBlock.days.length === 0) {
		return null;
	}

	const blockDays = [...alternativeBlock.days].sort((a, b) => a.getTime() - b.getTime());
	const dayKey = getDateKey(date);
	const dayIndex = blockDays.findIndex((d) => getDateKey(d) === dayKey);

	if (dayIndex < 0) return null;
	if (blockDays.length === 1) return "single";
	if (dayIndex === 0) return "start";
	if (dayIndex === blockDays.length - 1) return "end";
	return "middle";
}

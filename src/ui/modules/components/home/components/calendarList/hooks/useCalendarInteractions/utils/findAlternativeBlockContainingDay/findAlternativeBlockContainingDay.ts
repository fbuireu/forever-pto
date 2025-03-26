import type { BlockOpportunity } from "@modules/components/home/components/calendarList/hooks/useCalendar/types";
import { getDateKey } from "@modules/components/home/components/calendarList/hooks/utils/getDateKey/getDateKey";

interface FindAlternativeBlockContainingDayParams {
	day: Date;
	hoveredBlockId: string | null;
	alternativeBlocks: Record<string, BlockOpportunity[]>;
}

export function findAlternativeBlockContainingDay({
	day,
	hoveredBlockId,
	alternativeBlocks,
}: FindAlternativeBlockContainingDayParams): BlockOpportunity | null {
	if (!hoveredBlockId) return null;

	const alternatives = alternativeBlocks[hoveredBlockId] || [];
	const dayKey = getDateKey(day);

	for (const block of alternatives) {
		if (!block.days || block.days.length === 0) continue;

		if (block.days.some((d) => getDateKey(d) === dayKey)) {
			return block;
		}
	}

	return null;
}

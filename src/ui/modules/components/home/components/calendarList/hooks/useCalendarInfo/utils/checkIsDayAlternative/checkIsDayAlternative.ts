import type { BlockOpportunity } from '@modules/components/home/components/calendarList/hooks/useCalendar/types';
import { getDateKey } from '@modules/components/home/components/calendarList/hooks/utils/getDateKey/getDateKey';

interface CheckIsDayAlternativeParams {
	day: Date;
	hoveredBlockId: string | null;
	alternativeBlocks: Record<string, BlockOpportunity[]>;
	isDaySuggested: (day: Date) => boolean;
}

export function checkIsDayAlternative({
	day,
	hoveredBlockId,
	alternativeBlocks,
	isDaySuggested,
}: CheckIsDayAlternativeParams): boolean {
	if (!hoveredBlockId || isDaySuggested(day)) {
		return false;
	}

	const alternatives = alternativeBlocks[hoveredBlockId] || [];
	const dayKey = getDateKey(day);

	return alternatives.some((block) => block.days.some((d) => getDateKey(d) === dayKey));
}

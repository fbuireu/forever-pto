import { DEFAULT_CALENDAR_LIMITS, SCORE_MULTIPLIERS } from "@const/const";
import { getDateKey } from "@modules/components/home/components/calendarList/hooks/utils/getDateKey/getDateKey";
import type { BlockOpportunity } from "../../types";

interface GenerateAlternativesForBlockParams {
	block: BlockOpportunity & { id: string };
	blockOpportunities: BlockOpportunity[];
	suggestedDaysSet: Set<string>;
}

export function generateAlternativesForBlock({
	block,
	blockOpportunities,
	suggestedDaysSet,
}: GenerateAlternativesForBlockParams): BlockOpportunity[] {
	const blockDayKeys = new Set(block.days.map((d) => getDateKey(d)));
	const originalEffectiveDays = block.effectiveDays;
	const originalHolidayDays = block.holidayDays;

	return blockOpportunities
		.filter((opportunityBlock) => {
			if (opportunityBlock === block) return false;

			if (opportunityBlock.effectiveDays !== originalEffectiveDays) return false;

			if (opportunityBlock.holidayDays !== originalHolidayDays) return false;

			const hasSuggestedDays = opportunityBlock.days.some((d) => {
				const dayKey = getDateKey(d);
				return suggestedDaysSet.has(dayKey) && !blockDayKeys.has(dayKey);
			});
			if (hasSuggestedDays) return false;

			return true;
		})
		.sort((a, b) => {
			if (Math.abs(a.score - b.score) > SCORE_MULTIPLIERS.TOLERANCE.SCORE_DIFFERENCE) {
				return b.score - a.score;
			}
			if (a.blockSize === block.blockSize && b.blockSize !== block.blockSize) return -1;
			if (b.blockSize === block.blockSize && a.blockSize !== block.blockSize) return 1;
			return b.blockSize - a.blockSize;
		})
		.slice(0, DEFAULT_CALENDAR_LIMITS.MAX_ALTERNATIVES);
}

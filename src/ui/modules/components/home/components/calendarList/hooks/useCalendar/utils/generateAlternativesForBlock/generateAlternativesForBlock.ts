import { DEFAULT_CALENDAR_LIMITS, SCORE_MULTIPLIERS } from '@const/const';
import { getDateKey } from '@modules/components/home/components/calendarList/hooks/utils/getDateKey/getDateKey';
import type { BlockOpportunity } from '../../types';
import { areBlocksEquivalent } from '../areBlocksEquivalent/areBlocksEquivalent';

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
	const tolerance =
		block.blockSize === 1 ? SCORE_MULTIPLIERS.TOLERANCE.SINGLE_DAY : SCORE_MULTIPLIERS.TOLERANCE.MULTI_DAY;

	return blockOpportunities
		.filter((opportunityBlock) => {
			if (opportunityBlock === block) return false;

			const blockDayKeys = new Set(block.days.map((d) => getDateKey(d)));
			const hasSuggestedDays = opportunityBlock.days.some((d) => {
				const dayKey = getDateKey(d);
				return suggestedDaysSet.has(dayKey) && !blockDayKeys.has(dayKey);
			});
			if (hasSuggestedDays) return false;

			if (opportunityBlock.blockSize !== block.blockSize) return false;

			if (block.blockSize === 1) {
				return opportunityBlock.effectiveDays === block.effectiveDays;
			}
			return areBlocksEquivalent({ block1: block, block2: opportunityBlock, tolerance });
		})
		.slice(0, DEFAULT_CALENDAR_LIMITS.MAX_ALTERNATIVES);
}

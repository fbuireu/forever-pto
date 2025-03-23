import { DEFAULT_CALENDAR_LIMITS } from '@const/const';
import { getDateKey } from '@modules/components/home/components/calendarList/hooks/utils/getDateKey/getDateKey';
import type { BlockOpportunity } from '../../types';

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
	const alternativesForBlock: BlockOpportunity[] = [];
	const blockEffective = block.effectiveDays;

	const potentialAlternatives = blockOpportunities
		.filter(
			(opportunityBlock) =>
				opportunityBlock !== block &&
				opportunityBlock.blockSize === block.blockSize &&
				Math.abs(opportunityBlock.effectiveDays - blockEffective) <= 1 &&
				!opportunityBlock.days.some((d) => suggestedDaysSet.has(getDateKey(d))),
		)
		.slice(0, DEFAULT_CALENDAR_LIMITS.MAX_CANDIDATE_ALTERNATIVES);

	for (const alt of potentialAlternatives) {
		alternativesForBlock.push(alt);
		if (alternativesForBlock.length >= DEFAULT_CALENDAR_LIMITS.MAX_ALTERNATIVES) break;
	}

	return alternativesForBlock;
}

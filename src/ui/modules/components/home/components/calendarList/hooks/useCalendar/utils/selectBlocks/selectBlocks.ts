import { getDateKey } from "@modules/components/home/components/calendarList/hooks/utils/getDateKey/getDateKey";
import type { BlockOpportunity } from "../../types";
import { canAddBlock } from "../canAddBlock/canAddBlock";

interface SelectBlocksParams {
	blockOpportunities: BlockOpportunity[];
	daysRemaining: number;
	blockIdCounter: number;
	suggestedDaysSet: Set<string>;
}

interface SelectBlocksReturn {
	selectedBlocks: (BlockOpportunity & { id: string })[];
	finalSuggestedDays: Date[];
	daysRemaining: number;
	blockIdCounter: number;
}

export function selectBlocks({
	blockOpportunities,
	daysRemaining,
	blockIdCounter,
	suggestedDaysSet,
}: SelectBlocksParams): SelectBlocksReturn {
	const selectedBlocks: (BlockOpportunity & { id: string })[] = [];
	const finalSuggestedDays: Date[] = [];

	for (const block of blockOpportunities) {
		if (daysRemaining <= 0) break;

		if (canAddBlock({ blockDays: block.days, suggestedDaysSet, daysRemaining })) {
			const blockId = `block_${++blockIdCounter}`;

			selectedBlocks.push({ ...block, id: blockId });

			const blockLength = block.days.length;
			for (let i = 0; i < blockLength; i++) {
				const day = block.days[i];
				finalSuggestedDays.push(day);
				suggestedDaysSet.add(getDateKey(day));
			}

			daysRemaining -= blockLength;
		}
	}

	return {
		selectedBlocks,
		finalSuggestedDays,
		daysRemaining,
		blockIdCounter,
	};
}

import { getDateKey } from "@modules/components/home/components/calendarList/hooks/utils/getDateKey/getDateKey";
import { SCORE_MULTIPLIERS } from "../../../const";
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

	const sortedOpportunities = [...blockOpportunities].sort((a, b) => {
		const aEfficiencyRatio = a.effectiveDays / a.blockSize;
		const bEfficiencyRatio = b.effectiveDays / b.blockSize;
		const aScorePerDay = a.score / a.blockSize;
		const bScorePerDay = b.score / b.blockSize;

		const aHasBenefit = aEfficiencyRatio > SCORE_MULTIPLIERS.SELECTION.HOLIDAY_BENEFIT_THRESHOLD;
		const bHasBenefit = bEfficiencyRatio > SCORE_MULTIPLIERS.SELECTION.HOLIDAY_BENEFIT_THRESHOLD;

		if (aHasBenefit && !bHasBenefit) return -1;
		if (!aHasBenefit && bHasBenefit) return 1;

		if (aHasBenefit && bHasBenefit) {
			if (Math.abs(a.blockSize - b.blockSize) > SCORE_MULTIPLIERS.SELECTION.BLOCK_SIZE_DIFFERENCE) {
				return b.blockSize - a.blockSize;
			}
			if (Math.abs(aEfficiencyRatio - bEfficiencyRatio) > SCORE_MULTIPLIERS.SELECTION.EFFICIENCY_DIFFERENCE) {
				return bEfficiencyRatio - aEfficiencyRatio;
			}
		}

		if (Math.abs(aScorePerDay - bScorePerDay) > SCORE_MULTIPLIERS.SELECTION.SCORE_DIFFERENCE) {
			return bScorePerDay - aScorePerDay;
		}

		if (a.blockSize !== b.blockSize) {
			return b.blockSize - a.blockSize;
		}

		return b.score - a.score;
	});

	const filteredOpportunities = sortedOpportunities.filter((block, _, array) => {
		if (block.effectiveDays / block.blockSize > SCORE_MULTIPLIERS.SELECTION.HIGH_EFFICIENCY_THRESHOLD) return true;

		if (
			block.blockSize === SCORE_MULTIPLIERS.TOLERANCE.SINGLE_DAY &&
			block.effectiveDays / block.blockSize <= SCORE_MULTIPLIERS.SELECTION.HOLIDAY_BENEFIT_THRESHOLD
		) {
			const scorePerDay = block.score / block.blockSize;

			const betterAlternatives = array.filter(
				(alt) =>
					alt.blockSize >= SCORE_MULTIPLIERS.SELECTION.MIN_MULTI_DAY_SIZE &&
					alt.blockSize <= daysRemaining &&
					alt.effectiveDays / alt.blockSize > SCORE_MULTIPLIERS.SELECTION.BENEFIT_ALTERNATIVE_THRESHOLD &&
					canAddBlock({ blockDays: alt.days, suggestedDaysSet, daysRemaining }),
			);

			if (betterAlternatives.length > 0) {
				return false;
			}

			if (scorePerDay < SCORE_MULTIPLIERS.SELECTION.MIN_SCORE_PER_DAY) {
				return false;
			}
		}

		return true;
	});

	for (const block of filteredOpportunities) {
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

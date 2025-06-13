import type { EffectiveRatio } from "@modules/components/home/components/calendarList/hooks/types";
import type {
	BlockOpportunity,
	DayInfo,
} from "@modules/components/home/components/calendarList/hooks/useCalendar/types";
import { generateAlternativesForBlock } from "@modules/components/home/components/calendarList/hooks/useCalendar/utils/generateAlternativesForBlock/generateAlternativesForBlock";
import { getDateKey } from "../../../utils/getDateKey/getDateKey";
import { generateBlockOpportunities } from "../generateBlockOpportunities/generateBlockOpportunities";

interface FindOptimalGapsParams {
	yearMap: { map: Map<string, DayInfo>; allDays: Date[] };
	ptoDays: number;
	calculateEffectiveDays: (days: Date[]) => EffectiveRatio;
}

interface FindOptimalGapsReturn {
	suggestedDays: Date[];
	alternativeBlocks: Record<string, BlockOpportunity[]>;
	dayToBlockIdMap: Record<string, string>;
}

export function findOptimalGaps({
	yearMap,
	ptoDays,
	calculateEffectiveDays,
}: FindOptimalGapsParams): FindOptimalGapsReturn {
	if (ptoDays <= 0) {
		return {
			suggestedDays: [],
			alternativeBlocks: {},
			dayToBlockIdMap: {},
		};
	}

	const { map: daysMap, allDays } = yearMap;

	const availableWorkdays = allDays.filter((date) => {
		const day = daysMap.get(getDateKey(date));
		return day && !day.isFreeDay;
	});

	const blockOpportunities = generateBlockOpportunities({
		availableWorkdays,
		daysMap,
		remainingPtoDays: ptoDays,
		calculateEffectiveDays,
	});

	const optimalCombination = findBestCombinationFavoringLongerBlocks(blockOpportunities, ptoDays);

	const suggestedDaysSet = new Set<string>();
	const allSuggestedDays: Date[] = [];
	const allSelectedBlocks: (BlockOpportunity & { id: string })[] = [];
	let blockIdCounter = 0;

	for (const block of optimalCombination) {
		const blockId = `block_${++blockIdCounter}`;
		allSelectedBlocks.push({ ...block, id: blockId });

		for (const day of block.days) {
			allSuggestedDays.push(day);
			suggestedDaysSet.add(getDateKey(day));
		}
	}

	const newDayToBlockIdMap: Record<string, string> = {};
	const alternativesByBlockId: Record<string, BlockOpportunity[]> = {};

	for (const block of allSelectedBlocks) {
		for (const day of block.days) {
			newDayToBlockIdMap[getDateKey(day)] = block.id;
		}

		alternativesByBlockId[block.id] = generateAlternativesForBlock({
			block,
			blockOpportunities,
			suggestedDaysSet,
		});
	}

	return {
		suggestedDays: allSuggestedDays,
		alternativeBlocks: alternativesByBlockId,
		dayToBlockIdMap: newDayToBlockIdMap,
	};
}

function findBestCombinationFavoringLongerBlocks(blocks: BlockOpportunity[], maxDays: number): BlockOpportunity[] {
	if (blocks.length === 0 || maxDays <= 0) return [];

	const viableBlocks = blocks.filter((block) => block.blockSize <= maxDays);
	if (viableBlocks.length === 0) return [];

	const strategies = [
		() => findOptimalUsingMaxEffectiveDays(viableBlocks, maxDays),
		() => findOptimalUsingBestRatio(viableBlocks, maxDays),
		() => findOptimalUsingBalanced(viableBlocks, maxDays),
	];

	let bestCombination: BlockOpportunity[] = [];
	let bestTotalEffective = 0;

	for (const strategy of strategies) {
		const combination = strategy();
		const totalEffective = combination.reduce((sum, block) => sum + block.effectiveDays, 0);
		const totalPtoDays = combination.reduce((sum, block) => sum + block.blockSize, 0);

		const isEfficiencyBetter = totalEffective > bestTotalEffective;
		const isSameEfficiencyButMorePto =
			totalEffective === bestTotalEffective && totalPtoDays > bestCombination.reduce((sum, b) => sum + b.blockSize, 0);

		if (isEfficiencyBetter || isSameEfficiencyButMorePto) {
			bestCombination = combination;
			bestTotalEffective = totalEffective;
		}
	}

	return bestCombination;
}

function findOptimalUsingMaxEffectiveDays(blocks: BlockOpportunity[], maxDays: number): BlockOpportunity[] {
	const sortedBlocks = [...blocks].sort((a, b) => b.effectiveDays - a.effectiveDays);

	const result: BlockOpportunity[] = [];
	const usedDayKeys = new Set<string>();
	let remainingDays = maxDays;

	for (const block of sortedBlocks) {
		if (block.blockSize <= remainingDays) {
			const hasConflict = block.days.some((day) => usedDayKeys.has(getDateKey(day)));

			if (!hasConflict) {
				result.push(block);
				for (const day of block.days) {
					usedDayKeys.add(getDateKey(day));
				}
				remainingDays -= block.blockSize;

				if (remainingDays === 0) break;
			}
		}
	}

	return result;
}

function findOptimalUsingBestRatio(blocks: BlockOpportunity[], maxDays: number): BlockOpportunity[] {
	const sortedBlocks = [...blocks].sort((a, b) => {
		const ratioA = a.effectiveDays / a.blockSize;
		const ratioB = b.effectiveDays / b.blockSize;
		return ratioB - ratioA;
	});

	const result: BlockOpportunity[] = [];
	const usedDayKeys = new Set<string>();
	let remainingDays = maxDays;

	for (const block of sortedBlocks) {
		if (block.blockSize <= remainingDays) {
			const hasConflict = block.days.some((day) => usedDayKeys.has(getDateKey(day)));

			if (!hasConflict) {
				result.push(block);
				for (const day of block.days) {
					usedDayKeys.add(getDateKey(day));
				}
				remainingDays -= block.blockSize;

				if (remainingDays === 0) break;
			}
		}
	}

	return result;
}

function findOptimalUsingBalanced(blocks: BlockOpportunity[], maxDays: number): BlockOpportunity[] {
	const sortedBlocks = [...blocks].sort((a, b) => {
		const ratioA = a.effectiveDays / a.blockSize;
		const ratioB = b.effectiveDays / b.blockSize;

		if (Math.abs(ratioA - ratioB) > 0.5) {
			return ratioB - ratioA;
		}

		if (a.effectiveDays !== b.effectiveDays) {
			return b.effectiveDays - a.effectiveDays;
		}

		return b.blockSize - a.blockSize;
	});

	const result: BlockOpportunity[] = [];
	const usedDayKeys = new Set<string>();
	let remainingDays = maxDays;

	for (const block of sortedBlocks) {
		if (block.blockSize <= remainingDays) {
			const hasConflict = block.days.some((day) => usedDayKeys.has(getDateKey(day)));

			if (!hasConflict) {
				result.push(block);
				for (const day of block.days) {
					usedDayKeys.add(getDateKey(day));
				}
				remainingDays -= block.blockSize;

				if (remainingDays === 0) break;
			}
		}
	}

	return result;
}

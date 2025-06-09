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

	const optimalCombination = findGloballyOptimalCombination(blockOpportunities, ptoDays);

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

function findGloballyOptimalCombination(blocks: BlockOpportunity[], maxDays: number): BlockOpportunity[] {
	if (blocks.length === 0 || maxDays <= 0) return [];

	const viableBlocks = blocks.filter((block) => block.blockSize <= maxDays);
	if (viableBlocks.length === 0) return [];

	const searchLimit = viableBlocks.length > 50 ? 50 : viableBlocks.length;
	const topBlocks = viableBlocks
		.sort((a, b) => b.effectiveDays / b.blockSize - a.effectiveDays / a.blockSize)
		.slice(0, searchLimit);

	let bestCombination: BlockOpportunity[] = [];
	let bestEffectiveRatio = 0;

	const strategies = [
		() => findOptimalUsingDP(topBlocks, maxDays),
		() => findOptimalUsingGreedy(topBlocks, maxDays),
		() => findOptimalUsingBalanced(topBlocks, maxDays),
	];

	for (const strategy of strategies) {
		const combination = strategy();
		if (combination.length > 0) {
			const totalPtoDays = combination.reduce((sum, block) => sum + block.blockSize, 0);
			const totalEffectiveDays = combination.reduce((sum, block) => sum + block.effectiveDays, 0);
			const effectiveRatio = totalEffectiveDays / totalPtoDays;

			if (
				effectiveRatio > bestEffectiveRatio ||
				(Math.abs(effectiveRatio - bestEffectiveRatio) < 0.1 &&
					totalPtoDays > bestCombination.reduce((sum, b) => sum + b.blockSize, 0))
			) {
				bestCombination = combination;
				bestEffectiveRatio = effectiveRatio;
			}
		}
	}

	return bestCombination;
}

function findOptimalUsingDP(blocks: BlockOpportunity[], maxDays: number): BlockOpportunity[] {
	const n = blocks.length;
	const dp: Array<Array<{ effectiveDays: number; blocks: BlockOpportunity[] }>> = Array(n + 1)
		.fill(null)
		.map(() =>
			Array(maxDays + 1)
				.fill(null)
				.map(() => ({ effectiveDays: 0, blocks: [] })),
		);

	for (let i = 1; i <= n; i++) {
		const block = blocks[i - 1];
		const blockKeys = new Set(block.days.map(getDateKey));

		for (let days = 0; days <= maxDays; days++) {
			dp[i][days] = { ...dp[i - 1][days] };

			if (days >= block.blockSize) {
				const prevState = dp[i - 1][days - block.blockSize];
				const hasConflict = prevState.blocks.some((prevBlock) =>
					prevBlock.days.some((prevDay) => blockKeys.has(getDateKey(prevDay))),
				);

				if (!hasConflict) {
					const newEffective = prevState.effectiveDays + block.effectiveDays;
					if (newEffective > dp[i][days].effectiveDays) {
						dp[i][days] = {
							effectiveDays: newEffective,
							blocks: [...prevState.blocks, block],
						};
					}
				}
			}
		}
	}

	let best = dp[n][maxDays];
	for (let days = maxDays - 1; days >= Math.max(1, maxDays - 2); days--) {
		if (dp[n][days].effectiveDays > best.effectiveDays) {
			best = dp[n][days];
		}
	}

	return best.blocks;
}

function findOptimalUsingGreedy(blocks: BlockOpportunity[], maxDays: number): BlockOpportunity[] {
	const sorted = [...blocks].sort((a, b) => b.effectiveDays / b.blockSize - a.effectiveDays / a.blockSize);
	const result: BlockOpportunity[] = [];
	const usedDayKeys = new Set<string>();
	let remainingDays = maxDays;

	for (const block of sorted) {
		if (block.blockSize <= remainingDays) {
			const hasConflict = block.days.some((day) => usedDayKeys.has(getDateKey(day)));
			if (!hasConflict) {
				result.push(block);
				block.days.forEach((day) => usedDayKeys.add(getDateKey(day)));
				remainingDays -= block.blockSize;
			}
		}
	}

	return result;
}

function findOptimalUsingBalanced(blocks: BlockOpportunity[], maxDays: number): BlockOpportunity[] {
	const result: BlockOpportunity[] = [];
	const usedDayKeys = new Set<string>();
	let remainingDays = maxDays;

	const sorted = [...blocks].sort((a, b) => {
		const aEfficiency = a.effectiveDays / a.blockSize;
		const bEfficiency = b.effectiveDays / b.blockSize;

		if (Math.abs(aEfficiency - bEfficiency) > 0.3) {
			return bEfficiency - aEfficiency;
		}

		return a.blockSize - b.blockSize;
	});

	for (const block of sorted) {
		if (block.blockSize <= remainingDays) {
			const hasConflict = block.days.some((day) => usedDayKeys.has(getDateKey(day)));
			if (!hasConflict) {
				result.push(block);
				block.days.forEach((day) => usedDayKeys.add(getDateKey(day)));
				remainingDays -= block.blockSize;
			}
		}
	}

	return result;
}

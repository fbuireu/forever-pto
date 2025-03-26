import { DEFAULT_CALENDAR_LIMITS } from "@const/const";
import type { EffectiveRatio } from "@modules/components/home/components/calendarList/hooks/types";
import type {
	BlockOpportunity,
	DayInfo,
} from "@modules/components/home/components/calendarList/hooks/useCalendar/types";
import { canAddBlock } from "@modules/components/home/components/calendarList/hooks/useCalendar/utils/canAddBlock/canAddBlock";
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

	const availableWorkdays = allDays.filter((day) => {
		const dayInfo = daysMap.get(getDateKey(day));
		return dayInfo && !dayInfo.isFreeDay;
	});

	const blockOpportunities = generateBlockOpportunities({
		availableWorkdays,
		daysMap,
		remainingPtoDays: ptoDays,
		calculateEffectiveDays,
	});

	const selectedBlocks: (BlockOpportunity & { id: string })[] = [];
	const finalSuggestedDays: Date[] = [];
	const suggestedDaysSet = new Set<string>();
	let daysRemaining = ptoDays;
	let blockIdCounter = 0;

	for (let i = 0; i < Math.min(blockOpportunities.length, DEFAULT_CALENDAR_LIMITS.MAX_SEARCH_DEPTH); i++) {
		if (daysRemaining <= 0) break;

		const block = blockOpportunities[i];

		if (canAddBlock({ blockDays: block.days, suggestedDaysSet, daysRemaining })) {
			const blockId = `block_${++blockIdCounter}`;

			selectedBlocks.push({ ...block, id: blockId });

			for (const day of block.days) {
				finalSuggestedDays.push(day);
				suggestedDaysSet.add(getDateKey(day));
			}

			daysRemaining -= block.days.length;
		}
	}

	const newDayToBlockIdMap: Record<string, string> = {};

	for (const block of selectedBlocks) {
		for (const day of block.days) {
			newDayToBlockIdMap[getDateKey(day)] = block.id;
		}
	}

	const alternativesByBlockId: Record<string, BlockOpportunity[]> = {};

	for (const block of selectedBlocks) {
		alternativesByBlockId[block.id] = generateAlternativesForBlock({ block, blockOpportunities, suggestedDaysSet });
	}

	return {
		suggestedDays: finalSuggestedDays,
		alternativeBlocks: alternativesByBlockId,
		dayToBlockIdMap: newDayToBlockIdMap,
	};
}

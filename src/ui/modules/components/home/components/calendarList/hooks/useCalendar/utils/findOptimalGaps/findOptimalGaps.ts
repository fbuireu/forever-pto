import type { EffectiveRatio } from '@modules/components/home/components/calendarList/hooks/types';
import type {
  BlockOpportunity,
  DayInfo,
} from '@modules/components/home/components/calendarList/hooks/useCalendar/types';
import { generateAlternativesForBlock } from '@modules/components/home/components/calendarList/hooks/useCalendar/utils/generateAlternativesForBlock/generateAlternativesForBlock';
import { getDateKey } from '../../../utils/getDateKey/getDateKey';
import { generateBlockOpportunities } from '../generateBlockOpportunities/generateBlockOpportunities';
import { selectBlocks } from '../selectBlocks/selectBlocks';

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

  const suggestedDaysSet = new Set<string>();
  let daysRemaining = ptoDays;
  let blockIdCounter = 0;
  const allSelectedBlocks: (BlockOpportunity & { id: string })[] = [];
  const allSuggestedDays: Date[] = [];

  const firstPhaseResult = selectBlocks({
    blockOpportunities,
    daysRemaining,
    blockIdCounter,
    suggestedDaysSet,
  });

  allSelectedBlocks.push(...firstPhaseResult.selectedBlocks);
  allSuggestedDays.push(...firstPhaseResult.finalSuggestedDays);
  daysRemaining = firstPhaseResult.daysRemaining;
  blockIdCounter = firstPhaseResult.blockIdCounter;

  if (daysRemaining > 0) {
    const remainingOpportunities = blockOpportunities
      .filter((block) => {
        return !allSelectedBlocks.some(
          (selectedBlock) =>
            selectedBlock.startDay.getTime() === block.startDay.getTime() && selectedBlock.blockSize === block.blockSize
        );
      })
      .sort((a, b) => a.blockSize - b.blockSize);

    const secondPhaseResult = selectBlocks({
      blockOpportunities: remainingOpportunities,
      daysRemaining,
      blockIdCounter,
      suggestedDaysSet,
    });

    allSelectedBlocks.push(...secondPhaseResult.selectedBlocks);
    allSuggestedDays.push(...secondPhaseResult.finalSuggestedDays);
    blockIdCounter = secondPhaseResult.blockIdCounter;
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

  // Devolver resultados
  return {
    suggestedDays: allSuggestedDays,
    alternativeBlocks: alternativesByBlockId,
    dayToBlockIdMap: newDayToBlockIdMap,
  };
}

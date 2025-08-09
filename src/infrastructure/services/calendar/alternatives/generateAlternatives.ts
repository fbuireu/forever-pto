import { isSameDay } from 'date-fns';
import type { BaseBlock, SuggestionBlock } from '../suggestions/types';

export function generateAlternatives({
  selectedBlocks,
  allOpportunities,
}: {
  selectedBlocks: SuggestionBlock[];
  allOpportunities: BaseBlock[];
}): Record<string, SuggestionBlock[]> {
  const alternatives: Record<string, SuggestionBlock[]> = {};

  const usedDays = new Set<string>();
  selectedBlocks.forEach((block) => {
    block.days.forEach((day) => usedDays.add(day.toISOString()));
  });

  for (const block of selectedBlocks) {
    const similarBlocks = allOpportunities.filter((opp) => {
      const effectiveDiff = Math.abs(opp.effectiveDays - block.effectiveDays);
      if (effectiveDiff > 1) return false;

      const sizeDiff = Math.abs(opp.days.length - block.ptoDays);
      if (sizeDiff > 1) return false;

      const isSameBlock =
        opp.days.length === block.days.length && opp.days.every((day, i) => isSameDay(day, block.days[i]));
      if (isSameBlock) return false;

      const hasConflict = opp.days.some((day) => usedDays.has(day.toISOString()));
      return !hasConflict;
    });

    alternatives[block.id] = similarBlocks
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map((alt, index) => ({
        id: `${block.id}_alt_${index + 1}`,
        days: alt.days,
        effectiveDays: alt.effectiveDays,
        ptoDays: alt.days.length,
        score: alt.score,
      }));
  }

  return alternatives;
}

import { differenceInDays, format, isSameDay } from 'date-fns';
import type { Block, SuggestionBlock } from '../suggestions/types';

export function generateAlternatives({
  selectedBlocks,
  allOpportunities,
}: {
  selectedBlocks: SuggestionBlock[];
  allOpportunities: Block[];
}): Record<string, SuggestionBlock[]> {
  const usedDays = collectUsedDays(selectedBlocks);
  const alternatives: Record<string, SuggestionBlock[]> = {};

  for (const block of selectedBlocks) {
    const candidates = findCandidateAlternatives(block, allOpportunities, usedDays);
    const scored = scoreAlternatives(block, candidates);
    const topAlternatives = pickTopAlternatives(scored);

    alternatives[block.id] = formatAlternatives(block, topAlternatives);
  }

  return alternatives;
}

function collectUsedDays(blocks: SuggestionBlock[]): Set<string> {
  const days = new Set<string>();
  blocks.forEach((block) => block.days.forEach((day) => days.add(day.toISOString())));
  return days;
}

function isSameBlock(a: Block, b: SuggestionBlock): boolean {
  return a.days.length === b.days.length && a.days.every((day, i) => isSameDay(day, b.days[i]));
}

function matchesSimilarityCriteria(opp: Block, block: SuggestionBlock): boolean {
  const effectiveDiff = Math.abs(opp.effectiveDays - block.effectiveDays);
  const sizeDiff = Math.abs(opp.days.length - block.ptoDays);

  return (
    (effectiveDiff === 0 && sizeDiff === 0) ||
    (effectiveDiff <= 1 && sizeDiff === 0) ||
    (effectiveDiff === 0 && sizeDiff <= 1) ||
    (effectiveDiff <= 1 && sizeDiff <= 1)
  );
}

function findCandidateAlternatives(block: SuggestionBlock, allOpportunities: Block[], usedDays: Set<string>): Block[] {
  return allOpportunities.filter((opp) => {
    if (isSameBlock(opp, block)) return false;
    if (opp.days.some((day) => usedDays.has(day.toISOString()))) return false;
    return matchesSimilarityCriteria(opp, block);
  });
}

function scoreAlternatives(block: SuggestionBlock, candidates: Block[]) {
  const startDate = block.days[0];

  return candidates
    .map((alt) => {
      const effectiveDiff = Math.abs(alt.effectiveDays - block.effectiveDays);
      const sizeDiff = Math.abs(alt.days.length - block.ptoDays);
      const temporalDistance = Math.abs(differenceInDays(alt.days[0], startDate));

      const similarityScore = effectiveDiff * 10 + sizeDiff * 5;
      const proximityScore = temporalDistance * 0.1;
      const qualityScore = -alt.score;

      return {
        alternative: alt,
        totalScore: similarityScore + proximityScore + qualityScore * 0.5,
        effectiveDiff,
        sizeDiff,
        temporalDistance,
      };
    })
    .sort((a, b) => a.totalScore - b.totalScore);
}

function pickTopAlternatives(scored: ReturnType<typeof scoreAlternatives>) {
  const selected: typeof scored = [];
  const usedMonths = new Set<string>();

  for (const alt of scored) {
    if (selected.length >= 3) break;
    const month = format(alt.alternative.days[0], 'yyyy-MM');
    if (usedMonths.has(month) && selected.length > 0) continue;
    selected.push(alt);
    usedMonths.add(month);
  }

  for (const alt of scored) {
    if (selected.length >= 3) break;
    if (!selected.includes(alt)) selected.push(alt);
  }

  return selected;
}

function formatAlternatives(block: SuggestionBlock, scored: ReturnType<typeof scoreAlternatives>): SuggestionBlock[] {
  return scored.map((s, index) => ({
    id: `${block.id}_alt_${index + 1}`,
    days: s.alternative.days,
    effectiveDays: s.alternative.effectiveDays,
    ptoDays: s.alternative.days.length,
    score: s.alternative.score,
    _metadata: {
      effectiveDiff: s.effectiveDiff,
      sizeDiff: s.sizeDiff,
      temporalDistance: s.temporalDistance,
    },
  }));
}

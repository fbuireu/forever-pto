import { differenceInDays, format, isSameDay, startOfDay } from 'date-fns';
import { AlternativeBlock, Block, SuggestionBlock } from '../suggestions/types';

interface AlternativesConfig {
  maxAlternativesPerBlock: number;
  preferDifferentMonths: boolean;
  similarityThresholds: {
    effectiveDays: number;
    size: number;
    temporalDistance: number;
  };
}

const DEFAULT_CONFIG: AlternativesConfig = {
  maxAlternativesPerBlock: 3,
  preferDifferentMonths: true,
  similarityThresholds: {
    effectiveDays: 2,
    size: 1,
    temporalDistance: 30,
  },
};

export function generateAlternatives({
  selectedBlocks,
  allOpportunities,
  config = DEFAULT_CONFIG,
}: {
  selectedBlocks: SuggestionBlock[];
  allOpportunities: Block[];
  config?: Partial<AlternativesConfig>;
}): Map<string, AlternativeBlock[]> {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  const usedDays = new Set<string>();
  selectedBlocks.forEach((block) => {
    block.days.forEach((day) => {
      usedDays.add(startOfDay(day).toISOString());
    });
  });

  const alternativesMap = new Map<string, AlternativeBlock[]>();

  for (const targetBlock of selectedBlocks) {
    const candidates = allOpportunities.filter((opp) => {
      // Skip identical blocks
      if (
        opp.days.length === targetBlock.days.length &&
        opp.days.every((day, i) => isSameDay(day, targetBlock.days[i]))
      ) {
        return false;
      }

      // Skip blocks with used days
      if (opp.days.some((day) => usedDays.has(startOfDay(day).toISOString()))) {
        return false;
      }

      const effectiveDiff = Math.abs(opp.effectiveDays - targetBlock.effectiveDays);
      const sizeDiff = Math.abs(opp.days.length - targetBlock.ptoDays);

      return (
        effectiveDiff <= finalConfig.similarityThresholds.effectiveDays &&
        sizeDiff <= finalConfig.similarityThresholds.size
      );
    });

    // Score and sort candidates
    const scored = candidates
      .map((candidate) => {
        const temporalDistance = Math.abs(differenceInDays(candidate.days[0], targetBlock.days[0]));

        // Simple scoring: prefer similar effectiveness and good temporal distance
        const score =
          Math.abs(candidate.effectiveDays - targetBlock.effectiveDays) * 10 +
          Math.abs(candidate.days.length - targetBlock.ptoDays) * 20 +
          (temporalDistance < 7 ? 20 : temporalDistance > 60 ? 15 : 0) -
          candidate.score * 2;

        return { candidate, score, temporalDistance };
      })
      .sort((a, b) => a.score - b.score);

    // Select top alternatives
    const selected = selectDiverseAlternatives(scored, finalConfig);

    // Format as AlternativeBlocks
    alternativesMap.set(
      targetBlock.id,
      selected.map(
        (item, index): AlternativeBlock => ({
          id: `${targetBlock.id}_alt_${index + 1}`,
          days: item.candidate.days,
          effectiveDays: item.candidate.effectiveDays,
          ptoDays: item.candidate.days.length,
          score: item.candidate.score,
          alternativeFor: targetBlock.id,
          metadata: {
            similarityScore: item.score,
            effectiveDiff: Math.abs(item.candidate.effectiveDays - targetBlock.effectiveDays),
            sizeDiff: Math.abs(item.candidate.days.length - targetBlock.ptoDays),
            temporalDistance: item.temporalDistance,
            reason: generateReason(
              Math.abs(item.candidate.effectiveDays - targetBlock.effectiveDays),
              Math.abs(item.candidate.days.length - targetBlock.ptoDays),
              item.temporalDistance
            ),
          },
        })
      )
    );
  }

  return alternativesMap;
}

function selectDiverseAlternatives(
  scored: Array<{ candidate: Block; score: number; temporalDistance: number }>,
  config: AlternativesConfig
) {
  if (!config.preferDifferentMonths) {
    return scored.slice(0, config.maxAlternativesPerBlock);
  }

  const selected: typeof scored = [];
  const usedMonths = new Set<string>();

  // Try to get alternatives from different months
  for (const item of scored) {
    if (selected.length >= config.maxAlternativesPerBlock) break;

    const month = format(item.candidate.days[0], 'yyyy-MM');
    if (!usedMonths.has(month) || selected.length === 0) {
      selected.push(item);
      usedMonths.add(month);
    }
  }

  // Fill remaining slots
  for (const item of scored) {
    if (selected.length >= config.maxAlternativesPerBlock) break;
    if (!selected.includes(item)) {
      selected.push(item);
    }
  }

  return selected;
}

function generateReason(effectiveDiff: number, sizeDiff: number, temporalDistance: number): string {
  const reasons: string[] = [];

  if (effectiveDiff === 0 && sizeDiff === 0) {
    reasons.push('exact match');
  } else {
    if (effectiveDiff <= 1) reasons.push('similar coverage');
    if (sizeDiff === 0) reasons.push('same PTO days');
  }

  if (temporalDistance >= 14 && temporalDistance <= 45) {
    reasons.push('good timing');
  }

  return reasons.join(', ') || 'alternative option';
}

// Export utility function to get alternatives for a specific block
export function getAlternativesForBlock(
  blockId: string,
  alternativesMap: Map<string, AlternativeBlock[]>
): AlternativeBlock[] {
  return alternativesMap.get(blockId) || [];
}

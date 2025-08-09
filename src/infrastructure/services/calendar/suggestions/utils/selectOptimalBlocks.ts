import type { BaseBlock, SuggestionBlock } from '../types';

const MIN_EFFICIENCY_FOR_SINGLE_DAY = 2.5;

function canAddBlock(opportunity: BaseBlock, remainingDays: number, usedDays: Set<string>): boolean {
  if (opportunity.days.length > remainingDays) return false;
  return !opportunity.days.some((day) => usedDays.has(day.toISOString()));
}

function addBlockToSelection(block: BaseBlock, selected: BaseBlock[], usedDays: Set<string>): number {
  selected.push(block);
  block.days.forEach((day) => usedDays.add(day.toISOString()));
  return block.days.length;
}

function shouldSkipLowEfficiency(block: BaseBlock): boolean {
  if (block.days.length !== 1) return false;
  const efficiency = block.effectiveDays / block.days.length;
  return efficiency < MIN_EFFICIENCY_FOR_SINGLE_DAY;
}

function selectBlocks(
  opportunities: BaseBlock[],
  targetDays: number,
  checkEfficiency: boolean
): { selected: BaseBlock[]; remainingDays: number; usedDays: Set<string> } {
  const selected: BaseBlock[] = [];
  const usedDays = new Set<string>();
  let remainingDays = targetDays;

  for (const opportunity of opportunities) {
    if (remainingDays <= 0) break;

    if (checkEfficiency && shouldSkipLowEfficiency(opportunity)) continue;

    if (canAddBlock(opportunity, remainingDays, usedDays)) {
      const daysUsed = addBlockToSelection(opportunity, selected, usedDays);
      remainingDays -= daysUsed;
    }
  }

  return { selected, remainingDays, usedDays };
}

export function selectOptimalBlocks({
  opportunities,
  targetDays,
}: {
  opportunities: BaseBlock[];
  targetDays: number;
}): SuggestionBlock[] {
  // First pass: high efficiency blocks
  const firstPass = selectBlocks(opportunities, targetDays, true);

  // Second pass: fill remaining days if needed
  const finalSelection =
    firstPass.remainingDays > 0
      ? selectBlocks(
          opportunities.filter((o) => !firstPass.usedDays.has(o.days[0].toISOString())),
          firstPass.remainingDays,
          false
        )
      : firstPass;

  // Combine selections and map to SuggestionBlock
  const allSelected = [...firstPass.selected, ...finalSelection.selected];

  return allSelected.map((block, index) => ({
    id: `block_${index + 1}`,
    days: block.days,
    effectiveDays: block.effectiveDays,
    ptoDays: block.days.length,
    score: block.score,
  }));
}

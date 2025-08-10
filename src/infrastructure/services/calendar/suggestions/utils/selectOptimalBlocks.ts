import type { Block, SuggestionBlock } from '../types';

const MIN_EFFICIENCY_FOR_SINGLE_DAY = 2.5;

function canAddBlock(opportunity: Block, remainingDays: number, usedDays: Set<string>): boolean {
  if (opportunity.days.length > remainingDays) return false;
  return !opportunity.days.some((day) => usedDays.has(day.toISOString()));
}

function addBlockToSelection(block: Block, selected: Block[], usedDays: Set<string>): number {
  selected.push(block);
  block.days.forEach((day) => usedDays.add(day.toISOString()));
  return block.days.length;
}

function shouldSkipLowEfficiency(block: Block): boolean {
  if (block.days.length !== 1) return false;
  const efficiency = block.effectiveDays / block.days.length;
  return efficiency < MIN_EFFICIENCY_FOR_SINGLE_DAY;
}

function selectBlocks(
  opportunities: Block[],
  targetDays: number,
  checkEfficiency: boolean,
  usedDays: Set<string> = new Set() // Accept existing used days
): { selected: Block[]; remainingDays: number; usedDays: Set<string> } {
  const selected: Block[] = [];
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

// Helper function to check if two blocks are identical
function areBlocksIdentical(block1: Block, block2: Block): boolean {
  if (block1.days.length !== block2.days.length) return false;

  return block1.days.every((day, index) => day.getTime() === block2.days[index].getTime());
}

// Helper function to remove duplicates from blocks array
function removeDuplicateBlocks(blocks: Block[]): Block[] {
  const unique: Block[] = [];

  for (const block of blocks) {
    const isDuplicate = unique.some((existingBlock) => areBlocksIdentical(block, existingBlock));

    if (!isDuplicate) {
      unique.push(block);
    }
  }

  return unique;
}

export function selectOptimalBlocks({
  opportunities,
  targetDays,
}: {
  opportunities: Block[];
  targetDays: number;
}): SuggestionBlock[] {
  // First pass: high efficiency blocks
  const firstPass = selectBlocks(opportunities, targetDays, true);

  // Second pass: fill remaining days if needed, using the same usedDays set
  let allSelected = [...firstPass.selected];

  if (firstPass.remainingDays > 0) {
    // Filter out opportunities that are already used OR are duplicates of already selected
    const availableOpportunities = opportunities.filter((opp) => {
      // Skip if days are already used
      if (opp.days.some((day) => firstPass.usedDays.has(day.toISOString()))) {
        return false;
      }

      // Skip if it's a duplicate of already selected blocks
      return !allSelected.some((selected) => areBlocksIdentical(opp, selected));
    });

    const secondPass = selectBlocks(
      availableOpportunities,
      firstPass.remainingDays,
      false,
      new Set(firstPass.usedDays) // Pass a copy of used days
    );

    allSelected = [...allSelected, ...secondPass.selected];
  }

  // Additional safety: remove any remaining duplicates
  const uniqueSelected = removeDuplicateBlocks(allSelected);

  // Map to SuggestionBlock with unique IDs
  return uniqueSelected.map((block, index) => ({
    id: `block_${index + 1}`,
    days: block.days,
    effectiveDays: block.effectiveDays,
    ptoDays: block.days.length,
    score: block.score,
  }));
}

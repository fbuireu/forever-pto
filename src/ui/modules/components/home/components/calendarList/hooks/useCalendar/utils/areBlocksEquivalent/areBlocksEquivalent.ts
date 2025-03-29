import { isWeekend } from "date-fns";
import type { BlockOpportunity } from "../../types";

interface AreBlocksEquivalentParams {
	block1: BlockOpportunity;
	block2: BlockOpportunity;
	tolerance: number;
}

export function areBlocksEquivalent({ block1, block2, tolerance }: AreBlocksEquivalentParams): boolean {
	const effectiveDaysDiff = Math.abs(block1.effectiveDays - block2.effectiveDays);
	if (effectiveDaysDiff > tolerance) return false;

	if (block1.daysBeforeBlock !== block2.daysBeforeBlock || block1.daysAfterBlock !== block2.daysAfterBlock)
		return false;

	const block1Workdays = block1.days.filter((day) => !isWeekend(day)).length;
	const block2Workdays = block2.days.filter((day) => !isWeekend(day)).length;

	return Math.abs(block1Workdays - block2Workdays) <= 1;
}

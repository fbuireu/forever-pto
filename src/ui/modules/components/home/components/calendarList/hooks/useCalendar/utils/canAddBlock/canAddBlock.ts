import { getDateKey } from "@modules/components/home/components/calendarList/hooks/utils/getDateKey/getDateKey";

interface CanAddBlockParams {
	blockDays: Date[];
	suggestedDaysSet: Set<string>;
	daysRemaining: number;
}

export function canAddBlock({ blockDays, suggestedDaysSet, daysRemaining }: CanAddBlockParams): boolean {
	if (blockDays.length > daysRemaining) return false;

	const blockLength = blockDays.length;
	for (let i = 0; i < blockLength; i++) {
		if (suggestedDaysSet.has(getDateKey(blockDays[i]))) {
			return false;
		}
	}

	return true;
}

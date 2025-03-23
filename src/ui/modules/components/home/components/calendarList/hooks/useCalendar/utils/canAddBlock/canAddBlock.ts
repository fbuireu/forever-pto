import { getDateKey } from '@modules/components/home/components/calendarList/hooks/utils/getDateKey/getDateKey';

interface CanAddBlockParams {
	blockDays: Date[];
	suggestedDaysSet: Set<string>;
	daysRemaining: number;
}

export function canAddBlock({ blockDays, suggestedDaysSet, daysRemaining }: CanAddBlockParams): boolean {
	if (blockDays.length > daysRemaining) return false;

	return !blockDays.some((day) => suggestedDaysSet.has(getDateKey(day)));
}

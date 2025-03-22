import { getDateKey } from '@modules/components/home/components/calendarList/hooks/utils/getDateKey/getDateKey';

interface CheckIsDaySuggestedParams {
	day: Date;
	dayToBlockIdMap: Record<string, string>;
}

export function checkIsDaySuggested({ day, dayToBlockIdMap }: CheckIsDaySuggestedParams): boolean {
	const dayKey = getDateKey(day);
	return !!dayToBlockIdMap[dayKey];
}

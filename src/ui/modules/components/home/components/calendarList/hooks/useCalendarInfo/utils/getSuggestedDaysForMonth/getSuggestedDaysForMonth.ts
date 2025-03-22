import { isSameMonth } from 'date-fns';

interface GetSuggestedDaysForMonthParams {
	month: Date;
	suggestedDays: Date[];
}

export function getSuggestedDaysForMonth({ month, suggestedDays }: GetSuggestedDaysForMonthParams): Date[] {
	return suggestedDays.filter((day) => isSameMonth(day, month));
}

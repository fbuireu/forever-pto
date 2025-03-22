import { isSameDay } from 'date-fns';
import { getDateKey } from '../../../utils/getDateKey/getDateKey';

interface ToggleDaySelectionParams {
	day: Date;
	currentSelection: Date[];
}

export function toggleDaySelection({ day, currentSelection }: ToggleDaySelectionParams): Date[] {
	const dateKey = getDateKey(day);
	const selectedSet = new Set(currentSelection.map(getDateKey));

	if (selectedSet.has(dateKey)) {
		return currentSelection.filter((d) => !isSameDay(d, day));
	}

	return [...currentSelection, day];
}

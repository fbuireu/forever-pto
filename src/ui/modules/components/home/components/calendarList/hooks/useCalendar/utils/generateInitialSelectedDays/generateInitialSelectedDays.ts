import type { HolidayDTO } from '@application/dto/holiday/types';
import { eachDayOfInterval, endOfMonth, isWeekend, startOfMonth } from 'date-fns';
import { getDateKey } from '../../../utils/getDateKey/getDateKey';

interface GenerateInitialSelectedDaysParams {
	monthsToShow: Date[];
	holidays: HolidayDTO[];
}

export function generateInitialSelectedDays({ monthsToShow, holidays }: GenerateInitialSelectedDaysParams): Date[] {
	const initialSelectionSet = new Set<string>();
	const initialSelection: Date[] = [];

	for (const month of monthsToShow) {
		const daysInMonth = eachDayOfInterval({
			start: startOfMonth(month),
			end: endOfMonth(month),
		});

		for (const day of daysInMonth) {
			if (isWeekend(day)) {
				const key = getDateKey(day);
				if (!initialSelectionSet.has(key)) {
					initialSelectionSet.add(key);
					initialSelection.push(day);
				}
			}
		}
	}

	for (const holiday of holidays) {
		const key = getDateKey(holiday.date);
		if (!initialSelectionSet.has(key)) {
			initialSelectionSet.add(key);
			initialSelection.push(holiday.date);
		}
	}

	return initialSelection;
}

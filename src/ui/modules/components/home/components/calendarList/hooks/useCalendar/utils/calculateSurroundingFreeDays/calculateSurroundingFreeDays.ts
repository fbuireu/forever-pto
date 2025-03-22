import type { DayInfo } from '@modules/components/home/components/calendarList/hooks/useCalendar/types';
import { getDateKey } from '@modules/components/home/components/calendarList/hooks/utils/getDateKey/getDateKey';
import { addDays } from 'date-fns';

interface CalculateSurroundingFreeDaysParams {
	blockDays: Date[];
	daysMap: Map<string, DayInfo>;
}

interface CalculateEffectiveDaysReturn {
	daysBeforeBlock: number;
	daysAfterBlock: number;
}

export function calculateSurroundingFreeDays({
	blockDays,
	daysMap,
}: CalculateSurroundingFreeDaysParams): CalculateEffectiveDaysReturn {
	let daysBeforeBlock = 0;

	for (let i = 1; i <= 7; i++) {
		const dayBefore = addDays(blockDays[0], -i);
		const dayInfo = daysMap.get(getDateKey(dayBefore));

		if (dayInfo?.isFreeDay) {
			daysBeforeBlock++;
		} else {
			break;
		}
	}

	let daysAfterBlock = 0;
	for (let i = 1; i <= 7; i++) {
		const dayAfter = addDays(blockDays[blockDays.length - 1], i);
		const dayInfo = daysMap.get(getDateKey(dayAfter));

		if (dayInfo?.isFreeDay) {
			daysAfterBlock++;
		} else {
			break;
		}
	}

	return { daysBeforeBlock, daysAfterBlock };
}

import type { BlockPosition } from '@modules/components/home/components/calendarList/hooks/useCalendarInfo/types';
import { determineDayPosition } from '@modules/components/home/components/calendarList/hooks/useCalendarInteractions/utils/determineDayPosition/determineDayPosition';
import { getDaysInBlock } from '@modules/components/home/components/calendarList/hooks/useCalendarInteractions/utils/getDaysInBlock/getDaysInBlock';
import { getDateKey } from '@modules/components/home/components/calendarList/hooks/utils/getDateKey/getDateKey';
import { isSameDay } from 'date-fns';

interface GetDayPositionInBlockParams {
	date: Date;
	isDaySuggested: (day: Date) => boolean;
	dayToBlockIdMap: Record<string, string>;
}

export function getDayPositionInBlock({
	date,
	isDaySuggested,
	dayToBlockIdMap,
}: GetDayPositionInBlockParams): BlockPosition {
	if (!isDaySuggested(date)) return null;

	const dateKey = getDateKey(date);
	const blockId = dayToBlockIdMap[dateKey] || "";
	if (!blockId) return null;

	const blockDays = getDaysInBlock({ blockId, dayToBlockIdMap });

	return determineDayPosition({
		orderedDays: blockDays,
		targetDate: date,
		compareFn: isSameDay,
	});
}

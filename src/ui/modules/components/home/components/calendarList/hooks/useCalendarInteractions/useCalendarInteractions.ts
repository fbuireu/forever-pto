import type { BlockOpportunity } from '@modules/components/home/components/calendarList/hooks/useCalendar/types';
import { canDayBeSelected } from '@modules/components/home/components/calendarList/hooks/useCalendarInteractions/utils/canDayBeSelected/canDayBeSelected';
import { checkIsDaySuggested } from '@modules/components/home/components/calendarList/hooks/useCalendarInteractions/utils/checkIsDaySuggested/checkIsDaySuggested';
import { extractBlockIdFromEvent } from '@modules/components/home/components/calendarList/hooks/useCalendarInteractions/utils/extractBlockIdFromEvent/extractBlockIdFromEvent';
import { isPTOLimitReached } from '@modules/components/home/components/calendarList/hooks/useCalendarInteractions/utils/isPTOLimitReached/isPTOLimitReached';
import { toggleDaySelection } from '@modules/components/home/components/calendarList/hooks/useCalendarInteractions/utils/toggleDaySelection/toggleDaySelection';
import { type Dispatch, type FocusEvent, type MouseEvent, type SetStateAction, useCallback } from 'react';

interface UseCalendarInteractionsParams {
	selectedDays: Date[];
	setSelectedDays: Dispatch<SetStateAction<Date[]>>;
	setHoveredBlockId: Dispatch<SetStateAction<string | null>>;
	ptoDays: number;
	isHoliday: (date: Date) => boolean;
	isPastDayAllowed: () => boolean;
	alternativeBlocks: Record<string, BlockOpportunity[]>;
	dayToBlockIdMap: Record<string, string>;
}

export function useCalendarInteractions({
	selectedDays,
	setSelectedDays,
	setHoveredBlockId,
	ptoDays,
	isHoliday,
	isPastDayAllowed,
	alternativeBlocks,
	dayToBlockIdMap,
}: UseCalendarInteractionsParams) {
	const handleDaySelect = useCallback(
		(days: Date[] | undefined) => {
			if (!days || days.length === 0) return;

			const date = days[days.length - 1];
			if (!date) return;

			const { canSelect, message } = canDayBeSelected({ date, isHoliday, isPastDayAllowed });

			if (!canSelect) {
				if (message) alert(message);
				return;
			}

			setSelectedDays((prev) => {
				const newSelection = toggleDaySelection({ day: date, currentSelection: prev });

				if (newSelection.length > prev.length) {
					const { limitReached, message } = isPTOLimitReached({ selectedDays: prev, ptoDays, isHoliday });

					if (limitReached) {
						if (message) alert(message);
						return prev;
					}
				}

				return newSelection;
			});
		},
		[isHoliday, ptoDays, isPastDayAllowed, setSelectedDays],
	);

	const isDaySuggested = useCallback((day: Date) => checkIsDaySuggested({ day, dayToBlockIdMap }), [dayToBlockIdMap]);

	const handleDayInteraction = useCallback(
		(event: MouseEvent<HTMLButtonElement> | FocusEvent<HTMLButtonElement>) => {
			const blockId = extractBlockIdFromEvent({ event, alternativeBlocks });
			if (blockId) {
				setHoveredBlockId(blockId);
			}
		},
		[alternativeBlocks, setHoveredBlockId],
	);

	const handleDayMouseOut = useCallback(() => {
		setHoveredBlockId(null);
	}, [setHoveredBlockId]);

	return {
		handleDaySelect,
		handleDayInteraction,
		handleDayMouseOut,
		isDaySuggested,
	};
}

import type { BlockOpportunity } from "@modules/components/home/components/calendarList/hooks/useCalendar/types";
import { extractBlockIdFromEvent } from "@modules/components/home/components/calendarList/hooks/useCalendarInteractions/utils/extractBlockIdFromEvent/extractBlockIdFromEvent";
import { getDateKey } from "@modules/components/home/components/calendarList/hooks/utils/getDateKey/getDateKey";
import { type Dispatch, type FocusEvent, type MouseEvent, type SetStateAction, useCallback } from "react";

interface UseCalendarInteractionsParams {
	setHoveredBlockId: Dispatch<SetStateAction<string | null>>;
	ptoDays: number;
	isHoliday: (date: Date) => boolean;
	isPastDaysAllowed: () => boolean;
	alternativeBlocks: Record<string, BlockOpportunity[]>;
	dayToBlockIdMap: Record<string, string>;
}

export interface UseCalendarInteractionsReturn {
	handleDaySelect: (days: Date[] | undefined) => void;
	handleDayInteraction: (event: MouseEvent<HTMLButtonElement> | FocusEvent<HTMLButtonElement>) => void;
	handleDayMouseOut: () => void;
	isDaySuggested: (day: Date) => boolean;
}

export function useCalendarInteractions({
	setHoveredBlockId,
	alternativeBlocks,
	dayToBlockIdMap,
}: UseCalendarInteractionsParams): UseCalendarInteractionsReturn {
	const handleDaySelect = useCallback((_: Date[] | undefined) => {}, []);

	const isDaySuggested = useCallback(
		(day: Date) => {
			const dayKey = getDateKey(day);
			return !!dayToBlockIdMap[dayKey];
		},
		[dayToBlockIdMap],
	);

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

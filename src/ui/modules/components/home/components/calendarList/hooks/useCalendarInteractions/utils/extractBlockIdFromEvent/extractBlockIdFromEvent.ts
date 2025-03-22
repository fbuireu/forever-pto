import type { BlockOpportunity } from '@modules/components/home/components/calendarList/hooks/useCalendar/types';
import type { FocusEvent, MouseEvent } from 'react';

interface ExtractBlockIdFromEventParams {
	event: MouseEvent<HTMLButtonElement> | FocusEvent<HTMLButtonElement>;
	alternativeBlocks: Record<string, BlockOpportunity[]>;
}

export function extractBlockIdFromEvent({ event, alternativeBlocks }: ExtractBlockIdFromEventParams): string | null {
	const button = event.currentTarget;
	const isSuggested = button.dataset.suggested === "true";

	if (!isSuggested) return null;

	const blockId = button.dataset.blockId;
	if (!blockId || !alternativeBlocks[blockId]) return null;

	return blockId;
}

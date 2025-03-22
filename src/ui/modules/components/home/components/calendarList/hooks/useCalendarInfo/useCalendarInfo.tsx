import type { BlockOpportunity } from '@modules/components/home/components/calendarList/hooks/useCalendar/types';
import {
    calculateIntervalsForMonth,
} from '@modules/components/home/components/calendarList/hooks/useCalendarInfo/utils/calculateIntervalsForMonth/calculateIntervalsForMonth';
import {
    checkIsDayAlternative,
} from '@modules/components/home/components/calendarList/hooks/useCalendarInfo/utils/checkIsDayAlternative/checkIsDayAlternative';
import {
    formatIntervals,
} from '@modules/components/home/components/calendarList/hooks/useCalendarInfo/utils/formatIntervals/formatIntervals';

import {
    getDayPositionInBlock,
} from '@modules/components/home/components/calendarList/hooks/useCalendarInfo/utils/getDayPositionInBlock/getDayPositionInBlock';
import {
    getSuggestedDaysForMonth,
} from '@modules/components/home/components/calendarList/hooks/useCalendarInfo/utils/getSuggestedDaysForMonth/getSuggestedDaysForMonth';
import {
    getAlternativeDayPosition,
} from '@modules/components/home/components/calendarList/hooks/useCalendarInteractions/utils/getAlternativeDayPosition/getAlternativeDayPosition';
import { useCallback } from 'react';
import type { EffectiveRatio } from '@modules/components/home/components/calendarList/hooks/types';

interface UseCalendarInfoParams {
	suggestedDays: Date[];
	dayToBlockIdMap: Record<string, string>;
	hoveredBlockId: string | null;
	alternativeBlocks: Record<string, BlockOpportunity[]>;
	ptoDays: number;
	calculateEffectiveDays: (ptoDaysToAdd: Date[]) => EffectiveRatio;
	isDaySuggested: (day: Date) => boolean;
}

export function useCalendarInfo({
	suggestedDays,
	dayToBlockIdMap,
	hoveredBlockId,
	alternativeBlocks,
	ptoDays,
	calculateEffectiveDays,
	isDaySuggested,
}: UseCalendarInfoParams) {
	const isDayAlternative = useCallback(
		(day: Date) => checkIsDayAlternative({ day, hoveredBlockId, alternativeBlocks, isDaySuggested }),
		[hoveredBlockId, alternativeBlocks, isDaySuggested],
	);

	const datePositionInBlock = useCallback(
		(date: Date) => getDayPositionInBlock({ date, isDaySuggested, dayToBlockIdMap }),
		[isDaySuggested, dayToBlockIdMap],
	);

	const alternativeDayPosition = useCallback(
		(date: Date) => getAlternativeDayPosition({ date, hoveredBlockId, alternativeBlocks, isDayAlternative }),
		[hoveredBlockId, alternativeBlocks, isDayAlternative],
	);

	const suggestedDayForMonth = useCallback(
		(month: Date) => getSuggestedDaysForMonth({ month, suggestedDays }),
		[suggestedDays],
	);

	const getMonthSummary = useCallback(
		(month: Date) => {
			if (ptoDays <= 0 || suggestedDays.length === 0) {
				return null;
			}

			const intervals = calculateIntervalsForMonth({ month, suggestedDays, calculateEffectiveDays });

			if (intervals.length === 0) {
				return null;
			}

			const formattedIntervals = formatIntervals(intervals);

			if (formattedIntervals.length === 0) {
				return null;
			}

			return (
				<>
					{formattedIntervals.map(({ text, totalDays }) => (
						<p key={text} className={totalDays >= 7 ? "font-medium text-primary" : ""}>
							{text}
						</p>
					))}
				</>
			);
		},
		[ptoDays, suggestedDays, calculateEffectiveDays],
	);

	return {
		isDayAlternative,
		datePositionInBlock,
		alternativeDayPosition,
		suggestedDayForMonth,
		getMonthSummary,
	};
}

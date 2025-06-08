import type { HolidayDTO } from "@application/dto/holiday/types";
import type { EffectiveRatio } from "@modules/components/home/components/calendarList/hooks/types";
import type { BlockOpportunity } from "@modules/components/home/components/calendarList/hooks/useCalendar/types";
import type { CalendarStats } from "@modules/components/home/components/calendarList/hooks/useCalendarInfo/types";
import { calculateIntervalsForMonth } from "@modules/components/home/components/calendarList/hooks/useCalendarInfo/utils/calculateIntervalsForMonth/calculateIntervalsForMonth";
import { calculateStats } from "@modules/components/home/components/calendarList/hooks/useCalendarInfo/utils/calculateStats";
import { checkIsDayAlternative } from "@modules/components/home/components/calendarList/hooks/useCalendarInfo/utils/checkIsDayAlternative/checkIsDayAlternative";
import { formatIntervals } from "@modules/components/home/components/calendarList/hooks/useCalendarInfo/utils/formatIntervals/formatIntervals";
import { getDayPositionInBlock } from "@modules/components/home/components/calendarList/hooks/useCalendarInfo/utils/getDayPositionInBlock/getDayPositionInBlock";
import { getSuggestedDaysForMonth } from "@modules/components/home/components/calendarList/hooks/useCalendarInfo/utils/getSuggestedDaysForMonth/getSuggestedDaysForMonth";
import { getAlternativeDayPosition } from "@modules/components/home/components/calendarList/hooks/useCalendarInteractions/utils/getAlternativeDayPosition/getAlternativeDayPosition";
import { useLocale, type useTranslations } from "next-intl";
import { type ReactNode, useCallback, useMemo } from "react";

interface UseCalendarInfoParams {
	suggestedDays: Date[];
	dayToBlockIdMap: Record<string, string>;
	hoveredBlockId: string | null;
	alternativeBlocks: Record<string, BlockOpportunity[]>;
	ptoDays: number;
	holidays: HolidayDTO[];
	country?: string;
	calculateEffectiveDays: (ptoDaysToAdd: Date[]) => EffectiveRatio;
	isDaySuggested: (day: Date) => boolean;
	t: ReturnType<typeof useTranslations>;
}

interface UseCalendarInfoReturn {
	isDayAlternative: (day: Date) => boolean;
	datePositionInBlock: (date: Date) => string | null;
	alternativeDayPosition: (date: Date) => string | null;
	suggestedDayForMonth: (month: Date) => Date[];
	getMonthSummary: (month: Date) => ReactNode | null;
	stats: CalendarStats;
}

export function useCalendarInfo({
	suggestedDays,
	dayToBlockIdMap,
	hoveredBlockId,
	alternativeBlocks,
	ptoDays,
	holidays,
	calculateEffectiveDays,
	isDaySuggested,
	t,
}: UseCalendarInfoParams): UseCalendarInfoReturn {
	const locale = useLocale();

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

			const formattedIntervals = formatIntervals({ intervals, locale, t });

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
		[ptoDays, suggestedDays, calculateEffectiveDays, locale, t],
	);

	const stats = useMemo(
		() =>
			calculateStats({
				holidays,
				suggestedDays,
				calculateEffectiveDays,
				ptoDays,
			}),
		[holidays, suggestedDays, calculateEffectiveDays, ptoDays],
	);

	return {
		isDayAlternative,
		datePositionInBlock,
		alternativeDayPosition,
		suggestedDayForMonth,
		getMonthSummary,
		stats,
	};
}

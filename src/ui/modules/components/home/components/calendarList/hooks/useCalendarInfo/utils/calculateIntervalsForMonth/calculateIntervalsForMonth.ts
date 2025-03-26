import type { EffectiveRatio } from "@modules/components/home/components/calendarList/hooks/types";
import type { IntervalInfo } from "@modules/components/home/components/calendarList/hooks/useCalendarInfo/types";
import { getSuggestedDaysForMonth } from "@modules/components/home/components/calendarList/hooks/useCalendarInfo/utils/getSuggestedDaysForMonth/getSuggestedDaysForMonth";
import { groupConsecutiveDays } from "@modules/components/home/components/calendarList/hooks/utils/groupConsecutiveDays/groupConsecutiveDays";

interface CalculateIntervalsForMonthParams {
	month: Date;
	suggestedDays: Date[];
	calculateEffectiveDays: (days: Date[]) => EffectiveRatio;
}

export function calculateIntervalsForMonth({
	month,
	suggestedDays,
	calculateEffectiveDays,
}: CalculateIntervalsForMonthParams): IntervalInfo[] {
	const suggestedInMonth = getSuggestedDaysForMonth({ month, suggestedDays });

	if (!suggestedInMonth || suggestedInMonth.length === 0) {
		return [];
	}

	const intervals = groupConsecutiveDays(suggestedInMonth);

	if (intervals.length === 0) {
		return [];
	}

	return intervals.map((interval) => {
		const effectiveResult = calculateEffectiveDays(interval);

		return {
			interval,
			ptoDays: interval.length,
			totalFreeDays: effectiveResult.effective,
			startDate: interval[0],
			endDate: interval[interval.length - 1],
		};
	});
}

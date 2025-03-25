import type { HolidayDTO } from "@application/dto/holiday/types";
import type { EffectiveRatio } from "@modules/components/home/components/calendarList/hooks/types";
import type { VacationStats } from "@modules/components/home/components/calendarList/hooks/useCalendarInfo/types";

interface CalculateStatsParams {
	holidays: HolidayDTO[];
	suggestedDays: Date[];
	calculateEffectiveDays: (days: Date[]) => EffectiveRatio;
	country?: string;
	region?: string;
	ptoDays: number;
}

export function calculateStats({
	holidays,
	suggestedDays,
	calculateEffectiveDays,
	ptoDays,
}: CalculateStatsParams): VacationStats {
	const nationalHolidays = holidays.filter((holiday) => !holiday.location);
	const regionalHolidays = holidays.filter((holiday) => !!holiday.location);

	const totalHolidays = nationalHolidays.length + regionalHolidays.length;
	const ptoDaysUsed = suggestedDays.length;
	const effectiveResult = ptoDaysUsed > 0 ? calculateEffectiveDays(suggestedDays) : { effective: 0, ratio: 0 };
	const effectiveRatio = ptoDaysUsed > 0 ? (effectiveResult.effective / ptoDaysUsed).toFixed(2) : "0.00";

	return {
		nationalHolidays: nationalHolidays.length,
		regionalHolidays: regionalHolidays.length,
		totalHolidays,
		ptoDaysAvailable: ptoDays,
		ptoDaysUsed,
		effectiveDays: effectiveResult.effective,
		effectiveRatio,
	};
}

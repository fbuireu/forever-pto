import type { HolidayDTO } from '@application/dto/holiday/types';
import { DEFAULT_LANGUAGE } from '@const/const';
import type { EffectiveRatio } from '@modules/components/home/components/calendarList/hooks/types';
import type { VacationStats } from '@modules/components/home/components/calendarList/hooks/useCalendarInfo/types';
import { getUserLanguage } from '@shared/infrastructure/services/utils/getUserLanguage/getUserLanguage';
import countries from 'i18n-iso-countries';

try {
} catch (error) {
	console.warn("Error registering ISO countries locale:", error);
}

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
	country,
	region,
	ptoDays,
}: CalculateStatsParams): VacationStats {
	const nationalHolidays = holidays.filter((holiday) => !holiday.location);
	const regionalHolidays = holidays.filter((holiday) => !!holiday.location);
	const [userLanguage] = getUserLanguage();
	const language = userLanguage ?? DEFAULT_LANGUAGE;
	countries.registerLocale(require(`i18n-iso-countries/langs/${language}.json`));

	const totalHolidays = nationalHolidays.length + regionalHolidays.length;
	const ptoDaysUsed = suggestedDays.length;
	const effectiveResult = ptoDaysUsed > 0 ? calculateEffectiveDays(suggestedDays) : { effective: 0, ratio: 0 };
	const effectiveRatio = ptoDaysUsed > 0 ? (effectiveResult.effective / ptoDaysUsed).toFixed(2) : "0.00";
	const countryName = country ? (countries.getName(country.toUpperCase(), userLanguage) ?? country) : undefined;
	const regionName = regionalHolidays.length > 0 ? (regionalHolidays[0].location ?? region) : region;

	return {
		country: countryName,
		region: regionName,
		nationalHolidays: nationalHolidays.length,
		regionalHolidays: regionalHolidays.length,
		totalHolidays,
		ptoDaysAvailable: ptoDays,
		ptoDaysUsed,
		effectiveDays: effectiveResult.effective,
		effectiveRatio,
	};
}

import { getUserLocale } from "@application/actions/language";
import { isPremium } from "@application/actions/premium";
import { holidayDTO } from "@application/dto/holiday/holidayDTO";
import type { HolidayDTO } from "@application/dto/holiday/types";
import { getNationalHolidays } from "@infrastructure/services/holiday/utils/getNationalHolidays/getNationalHolidays";
import { getRegionalHolidays } from "@infrastructure/services/holiday/utils/getRegionalHolidays/getRegionalHolidays";
import { getUserLanguage } from "@shared/infrastructure/services/utils/getUserLanguage/getUserLanguage";
import { getUserTimezone } from "@shared/infrastructure/services/utils/getUserTimezone/getUserTimezone";

interface GetHolidaysParams {
	year: string;
	country?: string;
	region?: string;
	carryOverMonths: string;
}

export async function getHolidays({
	year,
	country,
	region,
	carryOverMonths,
}: GetHolidaysParams): Promise<HolidayDTO[]> {
	if (!country) {
		return [];
	}

	try {
		const userLanguage = (await getUserLocale()) ?? getUserLanguage()[0];
		const configuration = {
			languages: [userLanguage],
			timezone: getUserTimezone(),
		};
		const params = {
			country,
			configuration,
			year: Number(year),
		};
		const nationalHolidays = getNationalHolidays(params);
		const regionalHolidays = getRegionalHolidays({ ...params, region });

		return holidayDTO
			.create({
				raw: [...nationalHolidays, ...regionalHolidays],
				configuration: {
					year: Number(year),
					countryCode: country,
					carryOverMonths: (await isPremium()) ? Number(carryOverMonths) : 1,
				},
			})
			.sort((a, b) => a.date.getTime() - b.date.getTime());
	} catch (error) {
		return [];
	}
}

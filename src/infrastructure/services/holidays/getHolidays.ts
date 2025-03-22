import { holidayDTO } from '@application/dto/holiday/holidayDTO';
import type { HolidayDTO } from '@application/dto/holiday/types';
import { isPremium } from '@infrastructure/services/cookies/isPremium/isPremium';
import { getNationalHolidays } from '@infrastructure/services/holidays/utils/getNationalHolidays/getNationalHolidays';
import { getRegionalHolidays } from '@infrastructure/services/holidays/utils/getRegionalHolidays/getRegionalHolidays';
import { getUserLanguage } from '@shared/infrastructure/services/utils/getUserLanguage/getUserLanguage';
import { getUserTimezone } from '@shared/infrastructure/services/utils/getUserTimezone/getUserTimezone';

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
		const configuration = {
			languages: getUserLanguage(),
			timezone: getUserTimezone(),
		};

		const nationalHolidays = getNationalHolidays({
			country,
			configuration,
			year: Number(year),
		});
		const regionalHolidays = getRegionalHolidays({
			country,
			region,
			configuration,
			year: Number(year),
		});

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

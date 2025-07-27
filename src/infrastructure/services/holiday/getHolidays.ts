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

// Cache para holidays
const holidaysCache = new Map<string, { holidays: HolidayDTO[]; timestamp: number }>();
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutos

function generateCacheKey(params: GetHolidaysParams): string {
	return `${params.country}-${params.region}-${params.year}-${params.carryOverMonths}`;
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

	const cacheKey = generateCacheKey({ year, country, region, carryOverMonths });
	const now = Date.now();
	const cached = holidaysCache.get(cacheKey);

	// Usar cache si está disponible y no ha expirado
	if (cached && now - cached.timestamp < CACHE_DURATION) {
		return cached.holidays;
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

		// Ejecutar en paralelo para mejor performance
		const [nationalHolidays, regionalHolidays] = await Promise.all([
			Promise.resolve(getNationalHolidays(params)),
			Promise.resolve(getRegionalHolidays({ ...params, region })),
		]);

		const holidays = holidayDTO
			.create({
				raw: [...nationalHolidays, ...regionalHolidays],
				configuration: {
					year: Number(year),
					countryCode: country,
					carryOverMonths: (await isPremium()) ? Number(carryOverMonths) : 1,
				},
			})
			.sort((a, b) => a.date.getTime() - b.date.getTime());

		// Guardar en cache
		holidaysCache.set(cacheKey, { holidays, timestamp: now });

		return holidays;
	} catch (_) {
		return [];
	}
}

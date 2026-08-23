import { holidayDTO } from "@application/dto/holiday/dto";
import type { HolidayDTO } from "@application/dto/holiday/types";
import { getBetterStackInstance } from "@infrastructure/clients/logging/better-stack/client";
import { getRegions } from "@infrastructure/services/regions/getRegions";
import { Effect } from "effect";
import type { Locale } from "next-intl";
import { dateHolidaysSource } from "./source/dateHolidays";
import { observedHolidays } from "./source/observedHolidays";
import type { HolidaySource } from "./source/types";

const logger = getBetterStackInstance();

export interface GetHolidaysParams {
	year: number;
	country?: string;
	carryOverMonths: number;
	region?: string;
	locale: Locale;
	source?: HolidaySource;
}

export async function getHolidays({
	year,
	country,
	region,
	locale,
	carryOverMonths,
	source = dateHolidaysSource,
}: GetHolidaysParams) {
	if (!country) return [];

	const regions = getRegions(country, source);

	const program = Effect.try(() =>
		holidayDTO.create({
			raw: observedHolidays({ source, lookup: { country, region, year, locale } }),
			params: { year, carryOverMonths, regions },
		}),
	).pipe(
		Effect.catchAll((error) => {
			logger.logError("Error in getHolidays", error, { country, region, year });
			return Effect.succeed([] as HolidayDTO[]);
		}),
	);

	return Effect.runPromise(program);
}

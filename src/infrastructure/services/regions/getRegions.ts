import { regionDTO } from "@application/dto/region/dto";
import { getBetterStackInstance } from "@infrastructure/clients/logging/better-stack/client";
import { dateHolidaysSource } from "@infrastructure/services/holidays/source/dateHolidays";
import type { HolidaySource } from "@infrastructure/services/holidays/source/types";

const logger = getBetterStackInstance();

export function getRegions(countryCode?: string, source: HolidaySource = dateHolidaysSource) {
	if (!countryCode) return [];

	try {
		const regions = source.regionsOf(countryCode);

		if (!regions || !Object.values(regions).length) return [];

		return regionDTO.create({ raw: regions }).sort((a, b) => a.label.localeCompare(b.label));
	} catch (error) {
		logger.logError("Error in getRegions", error, { countryCode });
		return [];
	}
}

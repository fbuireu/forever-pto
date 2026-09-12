import { regionDTO } from "@application/dto/region/dto";
import { collateByLabel } from "@application/shared/utils/collate";
import { logger } from "@infrastructure/logging/logger";
import { dateHolidaysSource } from "@infrastructure/services/holidays/source/dateHolidays";
import type { HolidaySource } from "@infrastructure/services/holidays/source/types";

export interface GetRegionsParams {
	countryCode?: string;
	source?: HolidaySource;
}

export function getRegions({ countryCode, source = dateHolidaysSource }: GetRegionsParams = {}) {
	if (!countryCode) return [];

	try {
		const regions = source.regionsOf(countryCode);

		if (!regions || !Object.values(regions).length) return [];

		return collateByLabel({ options: regionDTO.create({ raw: regions }) });
	} catch (error) {
		logger.logError({ message: "Error in getRegions", error, context: { countryCode } });
		return [];
	}
}

import { regionDTO } from "@application/dto/region/dto";
import type { RegionDTO } from "@application/dto/region/types";
import { collateByLabel } from "@application/shared/utils/collate";
import { logger } from "@infrastructure/logging/logger";
import { dateHolidaysSource } from "@infrastructure/services/holidays/source/dateHolidays";

export function getRegions(countryCode: string): RegionDTO[] {
	if (!countryCode) return [];

	try {
		const regions = dateHolidaysSource.regionsOf(countryCode);

		if (!regions || !Object.values(regions).length) return [];

		return collateByLabel({ options: regionDTO.create(regions) });
	} catch (error) {
		logger.logError({ message: "Error in getRegions", error, context: { countryCode } });
		return [];
	}
}

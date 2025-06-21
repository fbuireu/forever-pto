import type { CountryDTO } from "@application/dto/country/types";
import type { RegionDTO } from "@application/dto/region/types";
import type { StatsData } from "@modules/components/home/components/stats/Stats";
import type { useTranslations } from "next-intl";

export interface HolidayMessageParams {
	userCountry?: CountryDTO;
	userRegion?: RegionDTO["label"];
	stats: Pick<StatsData, "nationalHolidays" | "regionalHolidays" | "totalHolidays">;
	t: ReturnType<typeof useTranslations<"stats">>;
}

export function formatRegionalHolidaysMessage({
	userRegion,
	stats,
	t,
}: Pick<HolidayMessageParams, "userRegion" | "stats" | "t">): string {
	if (!userRegion) {
		return t("summary.noRegionSelected");
	}

	return stats.regionalHolidays > 0
		? t("summary.regionalPart", {
				regionalHolidays: stats.regionalHolidays,
				region: userRegion,
			})
		: t("summary.noRegionalHolidaysForRegion", {
				region: userRegion,
			});
}

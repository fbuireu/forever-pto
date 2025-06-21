import type { CountryDTO } from "@application/dto/country/types";
import type { RegionDTO } from "@application/dto/region/types";
import type { useTranslations } from "next-intl";
import type { StatsData } from "../../../Stats";
import { formatNationalHolidaysMessage } from "../formatNationalHolidaysMessage/formatNationalHolidaysMessage";
import { formatNoHolidaysMessage } from "../formatNoHolidaysMessage/formatNoHolidaysMessage";
import { formatRegionalHolidaysMessage } from "../formatRegionalHolidaysMessage/formatRegionalHolidaysMessage";

export interface HolidayMessageParams {
	userCountry?: CountryDTO;
	userRegion?: RegionDTO["label"];
	stats: Pick<StatsData, "nationalHolidays" | "regionalHolidays" | "totalHolidays">;
	t: ReturnType<typeof useTranslations<"stats">>;
}

export function formatHolidayMessage({ userCountry, userRegion, stats, t }: HolidayMessageParams): string {
	if (stats.totalHolidays === 0) {
		return formatNoHolidaysMessage({ userCountry, userRegion, t });
	}

	const nationalPart = formatNationalHolidaysMessage({ userCountry, stats, t });
	const regionalPart = formatRegionalHolidaysMessage({ userRegion, stats, t });
	const totalPart = t("summary.totalPart", { totalHolidays: stats.totalHolidays });

	return `${nationalPart}${regionalPart}${totalPart}`;
}

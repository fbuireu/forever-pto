import type { CountryDTO } from "@application/dto/country/types";
import type { RegionDTO } from "@application/dto/region/types";
import type { StatsData } from "@modules/components/home/components/stats/Stats";
import type { useTranslations } from "next-intl";

export interface HolidayMessageParams {
	userCountry?: CountryDTO;
	userRegion?: RegionDTO["label"];
	stats: StatsData;
	t: ReturnType<typeof useTranslations<"stats">>;
}

export function formatNoHolidaysMessage({
	userCountry,
	userRegion,
	t,
}: Pick<HolidayMessageParams, "userCountry" | "userRegion" | "t">): string {
	if (!userCountry?.label) {
		return t("summary.noCountryHolidays");
	}

	const baseMessage = t("summary.noHolidaysFound");
	const regionalMessage = userRegion ? t("summary.noRegionalHolidays", { region: userRegion }) : "";

	return `${baseMessage}${regionalMessage}`;
}

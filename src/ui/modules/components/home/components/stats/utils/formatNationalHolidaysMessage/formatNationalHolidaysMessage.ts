import type { CountryDTO } from "@application/dto/country/types";
import type { useTranslations } from "next-intl";
import type { StatsData } from "../../../Stats";

export interface HolidayMessageParams {
	userCountry?: CountryDTO;
	userRegion?: string;
	stats: Pick<StatsData, "nationalHolidays" | "regionalHolidays" | "totalHolidays">;
	t: ReturnType<typeof useTranslations<"stats">>;
}

export function formatNationalHolidaysMessage({
	userCountry,
	stats,
	t,
}: Pick<HolidayMessageParams, "userCountry" | "stats" | "t">): string {
	return userCountry?.label
		? t("summary.withCountry", {
				country: userCountry.label,
				flag: userCountry.flag,
				nationalHolidays: stats.nationalHolidays,
			})
		: t("summary.withoutCountry", {
				nationalHolidays: stats.nationalHolidays,
			});
}

import type { CountryDTO } from "@application/dto/country/types";
import type { useTranslations } from "next-intl";
import type { StatsData } from "../../../Stats";
import { type EffectivenessState, getEffectivenessState } from "../getEffectivenessState/getEffectivenessState";

export function getStatsVisibility(
	stats: StatsData,
	userCountry?: CountryDTO,
): {
	hasHolidays: boolean;
	showEffectiveness: boolean;
	showMetrics: boolean;
	effectivenessState: EffectivenessState;
} {
	const hasHolidays = stats.totalHolidays > 0;
	const effectivenessState = getEffectivenessState({
		stats,
		t: {} as ReturnType<typeof useTranslations<"holidaysTable">>,
	});

	return {
		hasHolidays,
		showEffectiveness: hasHolidays && !!userCountry?.label,
		showMetrics: effectivenessState === "showing",
		effectivenessState,
	};
}

import type { StatsData } from "@modules/components/home/components/stats/Stats";
import type { useTranslations } from "next-intl";
import { getEffectivenessState } from "../getEffectivenessState/getEffectivenessState";

export interface EffectivenessMessageParams {
	stats: Pick<StatsData, "ptoDaysAvailable" | "ptoDaysUsed" | "effectiveDays" | "effectiveRatio">;
	t: ReturnType<typeof useTranslations<"stats">>;
}

export function formatEffectivenessMessage({ stats, t }: EffectivenessMessageParams): string {
	const state = getEffectivenessState({ stats, t });

	switch (state) {
		case "calculating":
			return t("effectiveness.calculating", {
				ptoDaysAvailable: stats.ptoDaysAvailable,
			});
		case "disabled":
			return t("noPtoDays");
		default:
			return t("effectiveness.summaryStart", {
				ptoDaysAvailable: stats.ptoDaysAvailable,
				effectiveDays: stats.effectiveDays,
				effectiveRatio: stats.effectiveRatio,
			});
	}
}

import type { StatsData } from "@modules/components/home/components/stats/Stats";
import type { useTranslations } from "next-intl";

export interface EffectivenessMessageParams {
	stats: Pick<StatsData, "ptoDaysAvailable" | "ptoDaysUsed" | "effectiveDays" | "effectiveRatio">;
	t: ReturnType<typeof useTranslations<"stats">>;
}

export type EffectivenessState = "calculating" | "showing" | "disabled";

export function getEffectivenessState({ stats }: EffectivenessMessageParams): EffectivenessState {
	if (stats.ptoDaysAvailable === 0) return "disabled";
	if (stats.ptoDaysUsed === 0) return "calculating";
	return "showing";
}

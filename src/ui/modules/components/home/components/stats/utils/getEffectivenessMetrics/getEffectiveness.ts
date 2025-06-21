import type { StatsData } from "@modules/components/home/components/stats/Stats";
import type { useTranslations } from "next-intl";

export interface EffectivenessMessageParams {
	stats: Pick<StatsData, "ptoDaysAvailable" | "ptoDaysUsed" | "effectiveDays" | "effectiveRatio">;
	t: ReturnType<typeof useTranslations<"stats">>;
}

interface EffectivenessMetricBase {
	label: string;
	value: string | number;
	key: "ptoUsed" | "totalFreeDays" | "ratio";
}

export type EffectivenessMetric =
	| (EffectivenessMetricBase & { isBadge: false })
	| (EffectivenessMetricBase & { isBadge: true; badgeVariant: string });

export function getEffectiveness({ stats, t }: EffectivenessMessageParams): EffectivenessMetric[] {
	return [
		{
			label: t("effectiveness.ptoUsed"),
			value: stats.ptoDaysUsed,
			key: "ptoUsed",
			isBadge: false,
		},
		{
			label: t("effectiveness.totalFreeDays"),
			value: stats.effectiveDays,
			key: "totalFreeDays",
			isBadge: false,
		},
		{
			label: t("effectiveness.ratio"),
			value: `x${stats.effectiveRatio}`,
			key: "ratio",
			isBadge: true,
			badgeVariant: stats.effectiveRatio,
		},
	];
}

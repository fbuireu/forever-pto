import type { CountryDTO } from "@application/dto/country/types";
import type { RegionDTO } from "@application/dto/region/types";
import { CardContent } from "@modules/components/core/card/atoms/cardContent/CardContent";
import { CardHeader } from "@modules/components/core/card/atoms/cardHeader/CardHeader";
import { CardTitle } from "@modules/components/core/card/atoms/cardTitle/CardTitle";
import { Effectiveness } from "@modules/components/home/components/stats/atoms/effectiveness/Effectiveness";
import { formatEffectivenessMessage } from "@modules/components/home/components/stats/utils/formatEffectivenessMessage/formatEffectivenessMessage";
import { formatHolidayMessage } from "@modules/components/home/components/stats/utils/formatHolidayMessage/formatHolidayMessage";
import { getEffectiveness } from "@modules/components/home/components/stats/utils/getEffectivenessMetrics/getEffectiveness";
import { getStatsVisibility } from "@modules/components/home/components/stats/utils/getStatsVisibility/getStatsVisibility";
import { Card } from "@ui/modules/components/core/card/Card";
import { useTranslations } from "next-intl";
import { StatsDisabled } from "./atoms/statsDisabled/StatsDisabled";
import { StatsTitle } from "./atoms/statsTitle/StatsTitle";

export interface StatsData {
	country?: string;
	region?: string;
	nationalHolidays: number;
	regionalHolidays: number;
	totalHolidays: number;
	ptoDaysAvailable: number;
	ptoDaysUsed: number;
	effectiveDays: number;
	effectiveRatio: string;
}

interface StatsProps {
	userCountry?: CountryDTO;
	userRegion?: RegionDTO["label"];
	stats: StatsData;
}

export const Stats = ({ stats, userCountry, userRegion }: StatsProps) => {
	const t = useTranslations("stats");

	if (!stats) {
		return null;
	}

	const holidayMessage = formatHolidayMessage({ userCountry, userRegion, stats, t });
	const effectivenessMessage = formatEffectivenessMessage({ stats, t });
	const effectivenessMetrics = getEffectiveness({ stats, t });
	const { showEffectiveness, showMetrics, effectivenessState } = getStatsVisibility(stats, userCountry);

	return (
		<section className="w-full max-w-4xl mb-6">
			<Card className="w-full">
				<CardHeader className="pb-2">
					<CardTitle className="text-lg">{t("title")}</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<StatsTitle title={t("summary.title")} message={holidayMessage} />
					{showEffectiveness && (
						<Effectiveness
							title={t("effectiveness.title")}
							showMetrics={showMetrics}
							effectivenessMessage={effectivenessMessage}
							effectivenessMetrics={effectivenessMetrics}
							effectiveRatio={stats.effectiveRatio}
							t={t}
						/>
					)}
					{effectivenessState === "disabled" && <StatsDisabled message={effectivenessMessage} />}
				</CardContent>
			</Card>
			<span className="text-xs text-muted-foreground">
				{t("footer.faqDoubts")}{" "}
				<a href="#faq" className="text-primary hover:underline">
					{t("footer.faqLink")}
				</a>
			</span>
		</section>
	);
};

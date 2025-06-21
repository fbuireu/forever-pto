import { EffectivenessSummary } from "@modules/components/home/components/stats/atoms/effectiveness/atoms/metrics/atoms/efectivenessSummary/EfectivenessSumary";
import { EffectivenessMetric } from "@modules/components/home/components/stats/atoms/effectiveness/atoms/metrics/atoms/effectivenessMetric/EffectivenessMetric";
import type { getEffectiveness } from "@modules/components/home/components/stats/utils/getEffectivenessMetrics/getEffectiveness";
import type { useTranslations } from "next-intl";

interface MetricsProps {
	metrics: ReturnType<typeof getEffectiveness>;
	effectiveRatio: string;
	summaryMessage: string;
	t: ReturnType<typeof useTranslations<"stats">>;
}

export const EffectivenessMetrics = ({ metrics, effectiveRatio, summaryMessage, t }: MetricsProps) => (
	<>
		<div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
			{metrics.map((metric) => (
				<EffectivenessMetric key={metric.key} metric={metric} />
			))}
		</div>
		<EffectivenessSummary
			summaryMessage={summaryMessage}
			effectiveRatio={effectiveRatio}
			summaryEndMessage={t("effectiveness.summaryEnd")}
		/>
	</>
);

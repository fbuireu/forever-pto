import { EffectivenessMetrics } from "@modules/components/home/components/stats/atoms/effectiveness/atoms/metrics/EffectivenessMetrics";
import type { getEffectiveness } from "@modules/components/home/components/stats/utils/getEffectivenessMetrics/getEffectiveness";
import { Separator } from "@ui/modules/components/core/separator/Separator";
import type { useTranslations } from "next-intl";

interface EffectivenessProps {
	title: string;
	showMetrics: boolean;
	effectivenessMessage: string;
	effectivenessMetrics: ReturnType<typeof getEffectiveness>;
	effectiveRatio: string;
	t: ReturnType<typeof useTranslations<"stats">>;
}

export const Effectiveness = ({
	title,
	showMetrics,
	effectivenessMessage,
	effectivenessMetrics,
	effectiveRatio,
	t,
}: EffectivenessProps) => (
	<>
		<Separator />
		<div className="text-sm text-slate-700 dark:text-slate-300">
			<h3 className="font-medium text-base mb-3">{title}</h3>
			{showMetrics ? (
				<EffectivenessMetrics
					metrics={effectivenessMetrics}
					effectiveRatio={effectiveRatio}
					summaryMessage={effectivenessMessage}
					t={t}
				/>
			) : (
				<p>{effectivenessMessage}</p>
			)}
		</div>
	</>
);

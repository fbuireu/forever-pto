import type { getEffectiveness } from "@modules/components/home/components/stats/utils/getEffectivenessMetrics/getEffectiveness";
import { Badge } from "@ui/modules/components/core/badge/Badge";
import { getBadgeVariant } from "@ui/modules/components/home/components/stats/utils/getBadgeVariants/getBadgeVariant";

interface MetricProps {
	metric: ReturnType<typeof getEffectiveness>[number];
}
export const EffectivenessMetric = ({ metric }: MetricProps) => (
	<div className="bg-slate-100 dark:bg-slate-700 p-3 rounded-lg">
		<p className="text-xs text-slate-500 dark:text-slate-400">{metric.label}</p>
		{metric.isBadge ? (
			<Badge variant={getBadgeVariant(metric.badgeVariant)} className="mt-1 text-xl py-1 px-3 h-auto font-bold">
				{metric.value}
			</Badge>
		) : (
			<p className="text-2xl font-bold">{metric.value}</p>
		)}
	</div>
);

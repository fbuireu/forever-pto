import { Badge } from "@ui/modules/components/core/badge/Badge";
import { getBadgeVariant } from "@ui/modules/components/home/components/stats/utils/getBadgeVariants/getBadgeVariant";

interface EffectivenessSummaryProps {
	summaryMessage: string;
	effectiveRatio: string;
	summaryEndMessage: string;
}

export const EffectivenessSummary = ({
	summaryMessage,
	effectiveRatio,
	summaryEndMessage,
}: EffectivenessSummaryProps) => (
	<div className="flex flex-col items-start">
		<span>
			{summaryMessage}
			<Badge variant={getBadgeVariant(effectiveRatio)} className="inline-flex items-center mx-1 font-medium">
				x{effectiveRatio}
			</Badge>
			{summaryEndMessage}
		</span>
	</div>
);

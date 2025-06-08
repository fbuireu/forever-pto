import { Tooltip } from "@modules/components/core/tooltip/Tooltip";
import { TooltipContent } from "@modules/components/core/tooltip/atoms/tooltipContent/TooltipContent";
import { TooltipTrigger } from "@modules/components/core/tooltip/atoms/tooltipTrigger/TooltipTrigger";
import { TooltipProvider } from "@modules/components/core/tooltip/provider/TooltipProvider";
import { InfoIcon } from "lucide-react";
import { useTranslations } from "next-intl";

export const MonthSummaryTooltip = () => {
	const t = useTranslations("calendarList.monthlySummary");

	return (
		<TooltipProvider>
			<Tooltip>
				<TooltipTrigger asChild>
					<InfoIcon className="h-4 w-4 text-muted-foreground cursor-help" />
				</TooltipTrigger>
				<TooltipContent>{t("tooltip")}</TooltipContent>
			</Tooltip>
		</TooltipProvider>
	);
};

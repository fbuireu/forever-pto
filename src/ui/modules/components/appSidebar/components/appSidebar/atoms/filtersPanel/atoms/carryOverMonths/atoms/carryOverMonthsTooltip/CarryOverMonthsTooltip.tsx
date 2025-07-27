import { TooltipContent } from "@modules/components/core/tooltip/atoms/tooltipContent/TooltipContent";
import { TooltipTrigger } from "@modules/components/core/tooltip/atoms/tooltipTrigger/TooltipTrigger";
import { TooltipProvider } from "@modules/components/core/tooltip/provider/TooltipProvider";
import { Tooltip } from "@modules/components/core/tooltip/Tooltip";
import { InfoIcon } from "lucide-react";
import { type Locale, useTranslations } from "next-intl";
import { memo } from "react";

interface CarryOverMonthsTooltipProps {
	locale: Locale;
}

export const CarryOverMonthsTooltip = memo(({ locale }: CarryOverMonthsTooltipProps) => {
	const t = useTranslations("filters.carryOverMonths");

	return (
		<TooltipProvider>
			<Tooltip>
				<TooltipTrigger asChild>
					<InfoIcon className="h-4 w-4 text-muted-foreground cursor-help" />
				</TooltipTrigger>
				<TooltipContent className="w-50 text-pretty">{t("tooltip")}</TooltipContent>
			</Tooltip>
		</TooltipProvider>
	);
});

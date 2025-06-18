import { TooltipContent } from "@modules/components/core/tooltip/atoms/tooltipContent/TooltipContent";
import { TooltipTrigger } from "@modules/components/core/tooltip/atoms/tooltipTrigger/TooltipTrigger";
import { TooltipProvider } from "@modules/components/core/tooltip/provider/TooltipProvider";
import { Tooltip } from "@modules/components/core/tooltip/Tooltip";
import { InfoIcon } from "lucide-react";
import type { Locale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { memo } from "react";

interface AllowPasDaysInfoTooltipProps {
	locale: Locale;
}

export const AllowPasDaysInfoTooltip = memo(async ({ locale }: AllowPasDaysInfoTooltipProps) => {
	const t = await getTranslations({ locale, namespace: "filters.allowPastDays" });

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

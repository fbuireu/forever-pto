"use client";

import { useFiltersStore } from "@application/stores/filters";
import { PremiumFeatureId } from "@application/stores/premium";
import { Switch } from "@ui/modules/core/animate/base/Switch";
import { PremiumFeature } from "@ui/modules/premium/PremiumFeature";
import { SidebarFieldLabel } from "@ui/modules/sidebar/components/SidebarFieldLabel";
import { Undo2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useShallow } from "zustand/react/shallow";

export const AllowPastDays = () => {
	const t = useTranslations("sidebar.allowPastDays");
	const { allowPastDays, setAllowPastDays } = useFiltersStore(
		useShallow((state) => ({
			allowPastDays: state.allowPastDays,
			setAllowPastDays: state.setAllowPastDays,
		})),
	);

	return (
		<div className="space-y-2 w-full">
			<SidebarFieldLabel
				icon={<Undo2 size={16} />}
				title={t("title")}
				tooltip={{ label: t("tooltipLabel"), content: t("tooltip") }}
			/>
			<PremiumFeature feature={PremiumFeatureId.ALLOW_PAST_DAYS}>
				<div className="flex gap-2 w-full items-center">
					<Switch checked={allowPastDays} aria-label={t("title")} onCheckedChange={setAllowPastDays} />
					<p className="font-normal text-sm">{allowPastDays ? t("enabled") : t("disabled")}</p>
				</div>
			</PremiumFeature>
		</div>
	);
};

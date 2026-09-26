"use client";

import { logClientError } from "@application/shared/utils/clientLog";
import { Button } from "@ui/modules/core/primitives/Button";
import { useLocale, useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { toast } from "sonner";

export const Troubleshooting = () => {
	const locale = useLocale();
	const t = useTranslations("troubleshooting");
	const [cleared, setCleared] = useState(false);
	const [isPending, startTransition] = useTransition();

	const resetToDefaults = () => {
		startTransition(async () => {
			try {
				const [{ useFiltersStore }, { useHolidaysStore }] = await Promise.all([
					import("@application/stores/filters"),
					import("@application/stores/holidays"),
				]);
				const holidays = useHolidaysStore.getState();
				holidays.resetToDefaults();
				useFiltersStore.getState().resetToDefaults();

				const { country, region, year, carryOverMonths, ptoDays, allowPastDays, strategy, preferredMonths } =
					useFiltersStore.getState();

				if (country) {
					await holidays.fetchHolidays({ country, region, year, locale, carryOverMonths });

					await holidays.generateSuggestions({
						year,
						carryOverMonths,
						ptoDays,
						allowPastDays,
						strategy,
						preferredMonths,
						locale,
					});
				}

				setCleared(true);

				toast.success(t("successTitle"), {
					description: t("successDescription"),
				});
			} catch (error) {
				logClientError({ message: "Error resetting to defaults", error, context: { component: "Troubleshooting" } });
				toast.error(t("errorTitle"), {
					description: t("errorDescription"),
				});
			}
		});
	};

	return (
		<div className="space-y-2">
			<p className="text-sm text-muted-foreground">{t("description")}</p>
			<Button variant="destructive" onClick={resetToDefaults} disabled={cleared || isPending} className="flex mx-auto">
				{isPending ? t("clearing") : cleared ? t("cleared") : t("resetButton")}
			</Button>
		</div>
	);
};

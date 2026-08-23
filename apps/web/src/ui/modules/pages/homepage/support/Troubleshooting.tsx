"use client";

import { logClientError } from "@application/shared/utils/clientLog";
import { useFiltersStore } from "@application/stores/filters";
import { useHolidaysStore } from "@application/stores/holidays";
import { Button } from "@ui/modules/core/primitives/Button";
import { useLocale, useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { useShallow } from "zustand/react/shallow";

export const Troubleshooting = () => {
	const locale = useLocale();
	const t = useTranslations("troubleshooting");
	const resetFiltersStore = useFiltersStore((state) => state.resetToDefaults);

	const {
		resetToDefaults: resetHolidaysStore,
		fetchHolidays,
		generateSuggestions,
	} = useHolidaysStore(
		useShallow((state) => ({
			resetToDefaults: state.resetToDefaults,
			fetchHolidays: state.fetchHolidays,
			generateSuggestions: state.generateSuggestions,
		})),
	);
	const [cleared, setCleared] = useState(false);
	const [isPending, startTransition] = useTransition();

	const resetToDefaults = () => {
		startTransition(async () => {
			try {
				resetHolidaysStore();
				resetFiltersStore();

				const { country, region, year, carryOverMonths, ptoDays, allowPastDays, strategy } = useFiltersStore.getState();

				if (country) {
					await fetchHolidays({ country, region, year, locale, carryOverMonths });

					await generateSuggestions({
						year,
						carryOverMonths,
						ptoDays,
						allowPastDays,
						strategy,
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

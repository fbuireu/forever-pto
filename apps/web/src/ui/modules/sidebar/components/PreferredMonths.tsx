"use client";

import { startOfToday } from "@application/shared/utils/dates";
import { useFiltersStore } from "@application/stores/filters";
import { reachableMonths, reachablePreferredMonths } from "@domain/calendar/window";
import { track } from "@infrastructure/clients/logging/better-stack/tracking";
import { MonthToggles } from "@ui/modules/shared/MonthToggles";
import { SidebarFieldLabel } from "@ui/modules/sidebar/components/SidebarFieldLabel";
import { CalendarHeart } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { useShallow } from "zustand/react/shallow";

export const PreferredMonths = () => {
	const t = useTranslations("sidebar.preferredMonths");
	const { preferredMonths, setPreferredMonths, year, carryOverMonths, allowPastDays } = useFiltersStore(
		useShallow((state) => ({
			preferredMonths: state.preferredMonths,
			setPreferredMonths: state.setPreferredMonths,
			year: state.year,
			carryOverMonths: state.carryOverMonths,
			allowPastDays: state.allowPastDays,
		})),
	);
	const reachable = useMemo(
		() => reachableMonths({ year, carryOverMonths, allowPastDays, today: startOfToday() }),
		[year, carryOverMonths, allowPastDays],
	);
	const chosen = reachablePreferredMonths({ preferredMonths, reachable });

	const handleChange = (months: number[]) => {
		setPreferredMonths(months);
		track({
			event: "planning_input_changed",
			properties: { input: "preferredMonths", inputValue: months.toSorted((a, b) => a - b).join(",") },
		});
	};

	return (
		<div className="space-y-2 w-full mt-4">
			<SidebarFieldLabel
				icon={<CalendarHeart size={16} />}
				title={t("title")}
				tooltip={{ label: t("tooltipLabel"), content: t("tooltip") }}
			/>
			<MonthToggles
				label={t("title")}
				window={{ year, carryOverMonths }}
				months={preferredMonths}
				onChange={handleChange}
				reachable={reachable}
			/>
			{chosen.length === 0 && <p className="text-xs text-muted-foreground">{t("anyMonth")}</p>}
		</div>
	);
};

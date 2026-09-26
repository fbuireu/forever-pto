"use client";

import { useFiltersStore } from "@application/stores/filters";
import { track } from "@infrastructure/clients/logging/better-stack/tracking";
import { MonthToggles } from "@ui/modules/shared/MonthToggles";
import { SidebarFieldLabel } from "@ui/modules/sidebar/components/SidebarFieldLabel";
import { CalendarHeart } from "lucide-react";
import { useTranslations } from "next-intl";
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

	const handleChange = (months: number[]) => {
		setPreferredMonths(months);
		track({
			event: "planning_input_changed",
			properties: { input: "preferredMonths", inputValue: months.join(",") },
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
				planningWindow={{ year, carryOverMonths }}
				allowPastDays={allowPastDays}
				months={preferredMonths}
				onChange={handleChange}
			/>
		</div>
	);
};

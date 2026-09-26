"use client";

import { getMonthNames } from "@application/shared/utils/dates";
import { useFiltersStore } from "@application/stores/filters";
import { track } from "@infrastructure/clients/logging/better-stack/tracking";
import { SidebarFieldLabel } from "@ui/modules/sidebar/components/SidebarFieldLabel";
import { cn } from "@ui/utils/cn";
import { CalendarHeart } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useMemo } from "react";
import { useShallow } from "zustand/react/shallow";

export const PreferredMonths = () => {
	const t = useTranslations("sidebar.preferredMonths");
	const locale = useLocale();
	const { preferredMonths, setPreferredMonths } = useFiltersStore(
		useShallow((state) => ({
			preferredMonths: state.preferredMonths,
			setPreferredMonths: state.setPreferredMonths,
		})),
	);
	const shortNames = useMemo(() => getMonthNames({ locale }), [locale]);
	const longNames = useMemo(() => getMonthNames({ locale, format: "long" }), [locale]);

	const toggle = (month: number) => {
		const next = preferredMonths.includes(month)
			? preferredMonths.filter((selected) => selected !== month)
			: [...preferredMonths, month];

		setPreferredMonths(next);
		track({
			event: "planning_input_changed",
			properties: { input: "preferredMonths", inputValue: next.toSorted((a, b) => a - b).join(",") },
		});
	};

	return (
		<div className="space-y-2 w-full mt-4">
			<SidebarFieldLabel
				icon={<CalendarHeart size={16} />}
				title={t("title")}
				tooltip={{ label: t("tooltipLabel"), content: t("tooltip") }}
			/>
			<fieldset className="grid grid-cols-4 gap-1.5 m-0 p-0 border-0 min-w-0" aria-label={t("title")}>
				{shortNames.map((name, month) => {
					const selected = preferredMonths.includes(month);

					return (
						<button
							key={longNames[month]}
							type="button"
							aria-pressed={selected}
							aria-label={longNames[month]}
							onClick={() => toggle(month)}
							className={cn(
								"rounded-md border-[2px] border-[var(--frame)] px-1.5 py-1 text-xs font-semibold capitalize transition-colors duration-75 cursor-pointer",
								selected
									? "bg-[var(--accent)] text-[var(--color-brand-ink)] shadow-[var(--shadow-brutal-xs)]"
									: "bg-[var(--surface-panel)] text-muted-foreground hover:bg-[var(--surface-panel-soft)]",
							)}
						>
							{name}
						</button>
					);
				})}
			</fieldset>
			{preferredMonths.length === 0 && <p className="text-xs text-muted-foreground">{t("anyMonth")}</p>}
		</div>
	);
};

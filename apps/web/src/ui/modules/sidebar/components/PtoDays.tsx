"use client";

import { MAX_PTO_DAYS, MIN_PTO_DAYS, useFiltersStore } from "@application/stores/filters";
import { useHolidaysStore } from "@application/stores/holidays";
import { track } from "@infrastructure/clients/logging/better-stack/tracking";
import { usePlanReadout } from "@ui/hooks/usePlanReadout";
import { Counter } from "@ui/modules/core/animate/components/Counter";
import { SlidingNumber } from "@ui/modules/core/animate/text/SlidingNumber";
import { Button } from "@ui/modules/core/primitives/Button";
import { cn } from "@ui/utils/cn";
import { CalendarDays, Clock } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback } from "react";
import { useShallow } from "zustand/react/shallow";
import { SidebarFieldLabel } from "./SidebarFieldLabel";

export const PtoDays = () => {
	const t = useTranslations("ptoDays");
	const { ptoDays, setPtoDays } = useFiltersStore(
		useShallow((state) => ({
			ptoDays: state.ptoDays,
			setPtoDays: state.setPtoDays,
		})),
	);
	const { resetManualSelection, trimManualDays, askForPlan } = useHolidaysStore(
		useShallow((state) => ({
			resetManualSelection: state.resetManualSelection,
			trimManualDays: state.trimManualDays,
			askForPlan: state.askForPlan,
		})),
	);
	const handleReset = () => {
		askForPlan();
		resetManualSelection();
		track({ event: "manual_changes_reset", properties: { surface: "sidebar" } });
	};
	const { suggested: activeSuggestedCount, manual: manualCount, remaining, hasManualChanges } = usePlanReadout();
	const isDecrementDisabled = ptoDays <= MIN_PTO_DAYS;
	const isIncrementDisabled = ptoDays >= MAX_PTO_DAYS;

	const handleChange = useCallback(
		(value: number) => {
			const newValue = Math.min(MAX_PTO_DAYS, Math.max(MIN_PTO_DAYS, value));
			if (newValue === ptoDays) return;

			askForPlan();
			setPtoDays(newValue);
			trimManualDays(newValue);
			track({
				event: "planning_input_changed",
				properties: { input: "ptoDays", inputValue: newValue },
			});
		},
		[setPtoDays, trimManualDays, ptoDays, askForPlan],
	);

	return (
		<div className="space-y-2 w-full">
			<SidebarFieldLabel icon={<CalendarDays size={16} />} title={t("title")} />
			<div className="flex items-center gap-3 justify-between">
				<p className="text-sm text-muted-foreground">{t("iHave")}</p>
				<Counter
					number={ptoDays}
					setNumber={handleChange}
					decrementLabel={t("decrease")}
					incrementLabel={t("increase")}
					label={t("days")}
					decrementButtonProps={{
						disabled: isDecrementDisabled,
					}}
					incrementButtonProps={{
						disabled: isIncrementDisabled,
					}}
				/>
			</div>
			<div className="space-y-2 mt-4 w-full">
				<SidebarFieldLabel icon={<Clock size={16} />} title={t("status")} />
				<div className="space-y-2 w-full">
					<div className="flex items-center justify-between text-sm">
						<span className="text-muted-foreground">{t("autoAssigned")}</span>
						<span>
							<span className="sr-only">{activeSuggestedCount}</span>
							<SlidingNumber
								number={activeSuggestedCount}
								className="font-semibold text-teal-600 dark:text-teal-400"
								aria-hidden="true"
							/>
						</span>
					</div>
					<div className="flex items-center justify-between text-sm">
						<span className="text-muted-foreground">{t("manuallySelected")}</span>
						<span>
							<span className="sr-only">{manualCount}</span>
							<SlidingNumber
								number={manualCount}
								className="font-semibold text-blue-600 dark:text-blue-400"
								aria-hidden="true"
							/>
						</span>
					</div>
					<div className="h-px bg-border my-2" />
					<div className="flex items-center justify-between text-sm">
						<span className="font-medium">{t("remaining")}</span>
						<span>
							<span className="sr-only">{remaining}</span>
							<SlidingNumber
								number={remaining}
								className={cn(
									"font-bold text-lg",
									remaining > 0 ? "text-green-600 dark:text-green-400" : "text-muted-foreground",
								)}
								aria-hidden="true"
							/>
						</span>
					</div>
					{hasManualChanges && (
						<Button variant="outline" size="sm" onClick={handleReset} className="w-full mt-2 text-xs" type="button">
							{t("resetManualChanges")}
						</Button>
					)}
					{remaining === 0 && !hasManualChanges && (
						<p className="text-xs text-muted-foreground text-center mt-2">{t("allAssigned")}</p>
					)}
					{remaining > 0 && <p className="text-xs text-muted-foreground text-center mt-2">{t("clickToAssign")}</p>}
				</div>
			</div>
		</div>
	);
};

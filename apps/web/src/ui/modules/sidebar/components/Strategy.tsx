"use client";

import { useFiltersStore } from "@application/stores/filters";
import { useHolidaysStore } from "@application/stores/holidays";
import { FilterStrategy } from "@domain/calendar/types";
import { track } from "@infrastructure/clients/logging/better-stack/tracking";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@ui/modules/core/animate/base/Collapsible";
import { ChevronDown } from "@ui/modules/core/animate/icons/ChevronDown";
import { AnimateIcon } from "@ui/modules/core/animate/icons/Icon";
import { Card, CardDescription } from "@ui/modules/core/primitives/Card";
import { Combobox } from "@ui/modules/core/primitives/Combobox";
import { STRATEGY_ICONS } from "@ui/modules/shared/strategyIcons";
import { cn } from "@ui/utils/cn";
import { AlertCircle, CheckCircle2, DicesIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { PreferredMonths } from "./PreferredMonths";
import { SidebarFieldLabel } from "./SidebarFieldLabel";

interface StrategyDetails {
	label: string;
	description: string;
	subtitle: string;
	pros: string[];
	cons: string[];
}

export const Strategy = () => {
	const t = useTranslations("sidebar.strategy");
	const { strategy, setStrategy } = useFiltersStore(
		useShallow((state) => ({
			strategy: state.strategy,
			setStrategy: state.setStrategy,
		})),
	);
	const askForPlan = useHolidaysStore((state) => state.askForPlan);
	const [detailsOpen, setDetailsOpen] = useState(false);

	const strategies = useMemo(() => {
		const details: Record<FilterStrategy, StrategyDetails> = {
			[FilterStrategy.GROUPED]: {
				label: t("grouped.label"),
				description: t("grouped.description"),
				subtitle: t("grouped.subtitle"),
				pros: [t("grouped.pros.longVacations"), t("grouped.pros.wholeWeeks")],
				cons: [t("grouped.cons.fewerDays"), t("grouped.cons.lowerEfficiency")],
			},
			[FilterStrategy.OPTIMIZED]: {
				label: t("optimized.label"),
				description: t("optimized.description"),
				subtitle: t("optimized.subtitle"),
				pros: [t("optimized.pros.maximumEfficiency"), t("optimized.pros.moreDays")],
				cons: [t("optimized.cons.mostlyLongWeekends"), t("optimized.cons.noLongTrip")],
			},
			[FilterStrategy.BALANCED]: {
				label: t("balanced.label"),
				description: t("balanced.description"),
				subtitle: t("balanced.subtitle"),
				pros: [t("balanced.pros.noLongStretch"), t("balanced.pros.restAllYear")],
				cons: [t("balanced.cons.noMaximization"), t("balanced.cons.noLongTrip")],
			},
			[FilterStrategy.MAIN_VACATION]: {
				label: t("mainVacation.label"),
				description: t("mainVacation.description"),
				subtitle: t("mainVacation.subtitle"),
				pros: [t("mainVacation.pros.yourTrip"), t("mainVacation.pros.bridgesAfter")],
				cons: [t("mainVacation.cons.mayHaveFewerDays")],
			},
		};

		return Object.values(FilterStrategy).map((value) => ({ value, icon: STRATEGY_ICONS[value], ...details[value] }));
	}, [t]);

	const handleStrategyChange = (value: FilterStrategy) => {
		if (value !== strategy) askForPlan();
		setStrategy(value);
		track({ event: "planning_input_changed", properties: { input: "strategy", inputValue: value } });
	};

	const currentStrategy = strategies.find(({ value }) => value === strategy);
	const CurrentIcon = currentStrategy?.icon;

	return (
		<div className="space-y-2 w-full">
			<SidebarFieldLabel
				controlId="strategy"
				icon={<DicesIcon size={16} />}
				title={t("title")}
				className="my-0 font-medium"
			/>
			<Combobox
				className="w-full"
				id="strategy"
				options={strategies}
				value={strategy}
				onChange={handleStrategyChange}
				disabled={!strategies.length}
				placeholder={t("placeholder")}
				searchPlaceholder={t("search")}
			/>
			{strategy === FilterStrategy.MAIN_VACATION && <PreferredMonths />}
			{currentStrategy && (
				<Collapsible open={detailsOpen} onOpenChange={setDetailsOpen}>
					<AnimateIcon animateOnHover>
						<CollapsibleTrigger className="flex items-center justify-between w-full mt-4 px-2 py-1 text-xs font-medium cursor-pointer rounded-md border-0 shadow-none bg-transparent hover:bg-[var(--surface-panel-soft)] hover:shadow-none hover:translate-x-0 hover:translate-y-0 active:shadow-none active:translate-x-0 active:translate-y-0 aria-expanded:shadow-none aria-expanded:translate-x-0 aria-expanded:translate-y-0 before:hidden">
							<span>{detailsOpen ? t("hideDetails") : t("showDetails")}</span>
							<ChevronDown className={cn("size-4 transition-transform duration-200", detailsOpen && "rotate-180")} />
						</CollapsibleTrigger>
					</AnimateIcon>
					<CollapsibleContent>
						<Card className="p-4 bg-muted/50 mt-2 text-xs">
							<div className="space-y-2">
								<div className="flex items-start gap-3">
									{CurrentIcon && <CurrentIcon className="size-6 text-primary" />}
									<div className="flex-1">
										<h4 className="font-semibold text-xs">{currentStrategy.description}</h4>
										<CardDescription className="text-xs">{currentStrategy.subtitle}</CardDescription>
									</div>
								</div>
								<div className="grid gap-1.5">
									<div className="flex flex-wrap gap-1">
										{currentStrategy.pros.map((pro) => (
											<span
												key={pro}
												className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded border border-green-500/30 bg-green-500/10 text-green-700 dark:text-green-400"
											>
												<CheckCircle2 className="size-2.5 shrink-0" />
												{pro}
											</span>
										))}
									</div>
									<div className="flex flex-wrap gap-1">
										{currentStrategy.cons.map((con) => (
											<span
												key={con}
												className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded border border-orange-500/30 bg-orange-500/10 text-orange-700 dark:text-orange-400"
											>
												<AlertCircle className="size-2.5 shrink-0" />
												{con}
											</span>
										))}
									</div>
								</div>
							</div>
						</Card>
					</CollapsibleContent>
				</Collapsible>
			)}
		</div>
	);
};

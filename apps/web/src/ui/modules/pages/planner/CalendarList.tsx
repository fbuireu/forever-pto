"use client";

import { useFiltersStore } from "@application/stores/filters";
import { useHolidaysStore } from "@application/stores/holidays";
import { planningWindowMonths } from "@domain/calendar/window";
import { useCalculationsWorker } from "@ui/hooks/useCalculationsWorker";
import { useStoresReady } from "@ui/hooks/useStoresReady";
import { TUTORIAL_ANCHOR } from "@ui/modules/tutorial/anchors";
import { cn } from "@ui/utils/cn";
import { Skeleton } from "boneyard-js/react";
import { useLocale } from "next-intl";
import { useCallback, useEffect, useMemo } from "react";
import { useShallow } from "zustand/react/shallow";
import { Calendar, CalendarSelectionMode, type DayStates } from "./calendar/Calendar";
import { CalendarListFixture } from "./calendar/CalendarListFixture";
import { usePlannerDayClick } from "./calendar/usePlannerDayClick";
import { isAlternative, isManuallySelected, isSuggestion } from "./utils/modifiers";

export const CalendarList = () => {
	const locale = useLocale();
	const { areStoresReady } = useStoresReady();

	const { carryOverMonths, year, allowPastDays, country, region, ptoDays, strategy } = useFiltersStore(
		useShallow((state) => ({
			carryOverMonths: state.carryOverMonths,
			year: state.year,
			allowPastDays: state.allowPastDays,
			country: state.country,
			region: state.region,
			ptoDays: state.ptoDays,
			strategy: state.strategy,
		})),
	);
	const {
		holidays,
		alternatives,
		suggestion,
		currentSelection,
		isCalculating,
		manuallySelectedDays,
		removedSuggestedDays,
		fetchHolidays,
		previewAlternativeIndex,
		toggleDaySelection,
		pruneDaysOutsideWindow,
		clearCalculation,
		planRevision,
	} = useHolidaysStore(
		useShallow((state) => ({
			holidays: state.holidays,
			alternatives: state.alternatives,
			suggestion: state.suggestion,
			currentSelection: state.currentSelection,
			isCalculating: state.isCalculating,
			manuallySelectedDays: state.manuallySelectedDays,
			removedSuggestedDays: state.removedSuggestedDays,
			fetchHolidays: state.fetchHolidays,
			previewAlternativeIndex: state.previewAlternativeIndex,
			toggleDaySelection: state.toggleDaySelection,
			pruneDaysOutsideWindow: state.pruneDaysOutsideWindow,
			clearCalculation: state.clearCalculation,
			planRevision: state.planRevision,
		})),
	);

	const { triggerCalculation } = useCalculationsWorker();

	const months = useMemo(() => planningWindowMonths({ carryOverMonths, year }), [carryOverMonths, year]);

	const dayStates = useMemo<DayStates>(
		() => ({
			suggested: isSuggestion({ currentSelection, removedSuggestedDays }),
			alternative: isAlternative({ alternatives, suggestion, previewAlternativeIndex, currentSelection }),
			manuallySelected: isManuallySelected(manuallySelectedDays),
		}),
		[currentSelection, removedSuggestedDays, alternatives, suggestion, previewAlternativeIndex, manuallySelectedDays],
	);

	const toggleDay = useCallback(
		(date: Date) => toggleDaySelection({ date, totalPtoDays: ptoDays, locale, allowPastDays }),
		[toggleDaySelection, ptoDays, locale, allowPastDays],
	);
	const handleDayToggle = usePlannerDayClick(toggleDay);

	useEffect(() => {
		pruneDaysOutsideWindow({ year, carryOverMonths });
	}, [pruneDaysOutsideWindow, year, carryOverMonths]);

	useEffect(() => {
		if (!country) return;
		fetchHolidays({ year, region, country, locale, carryOverMonths });
	}, [fetchHolidays, year, region, country, locale, carryOverMonths]);

	const canCalculate = ptoDays > 0 && holidays.length > 0 && months.length > 0;

	// biome-ignore lint/correctness/useExhaustiveDependencies: planRevision is a re-plan signal, not a value the body reads
	useEffect(() => {
		if (!canCalculate) return;

		triggerCalculation({
			year,
			carryOverMonths,
			ptoDays,
			allowPastDays,
			strategy,
			locale,
		});
	}, [triggerCalculation, canCalculate, year, carryOverMonths, ptoDays, allowPastDays, strategy, locale, planRevision]);

	useEffect(() => {
		if (!canCalculate && suggestion) clearCalculation();
	}, [canCalculate, suggestion, clearCalculation]);

	return (
		<Skeleton
			name="calendar-list"
			loading={!areStoresReady}
			fixture={<CalendarListFixture />}
			fallback={<CalendarListFixture />}
			className="w-full"
		>
			<div
				className={cn(
					"grid [grid-template-columns:repeat(auto-fit,minmax(min(100%,250px),1fr))] gap-5 mx-auto w-full justify-items-center sm:justify-items-stretch",
					isCalculating && "pointer-events-none",
				)}
				id="calendar"
				data-tutorial={TUTORIAL_ANCHOR.CALENDAR_LIST}
			>
				{months.map((month) => (
					<Calendar
						key={month.toISOString()}
						mode={CalendarSelectionMode.NONE}
						className="rounded-[14px] border-[3px] border-[var(--frame)] bg-card shadow-[var(--shadow-brutal-md)] [content-visibility:auto] [contain-intrinsic-block-size:310px]"
						month={month}
						weekStartsOn={1}
						locale={locale}
						holidays={holidays}
						allowPastDays={allowPastDays}
						dayStates={dayStates}
						onDayToggle={handleDayToggle}
						showOutsideDays
						fixedWeeks
					/>
				))}
			</div>
		</Skeleton>
	);
};

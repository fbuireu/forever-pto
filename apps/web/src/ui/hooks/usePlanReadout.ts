"use client";

import { useFiltersStore } from "@application/stores/filters";
import { useHolidaysStore } from "@application/stores/holidays";
import { measureBudget } from "@domain/calendar/utils/budget";
import { resolveSelectedDays } from "@domain/calendar/utils/selection";
import { useEffect, useMemo, useRef } from "react";
import { useShallow } from "zustand/react/shallow";

export const usePlacedPlan = () => {
	const { currentSelection, suggestion, manuallySelectedDays, removedSuggestedDays } = useHolidaysStore(
		useShallow((state) => ({
			currentSelection: state.currentSelection,
			suggestion: state.suggestion,
			manuallySelectedDays: state.manuallySelectedDays,
			removedSuggestedDays: state.removedSuggestedDays,
		})),
	);

	const activeSuggestion = currentSelection ?? suggestion;
	const placedDays = useMemo(
		() =>
			resolveSelectedDays({
				days: activeSuggestion?.days ?? [],
				manuallySelectedDays,
				removedSuggestedDays,
			}),
		[activeSuggestion, manuallySelectedDays, removedSuggestedDays],
	);

	return { activeSuggestion, placedDays, manuallySelectedDays, removedSuggestedDays };
};

export const usePlanReadout = () => {
	const { currentSelection, suggestion, manuallySelectedDays, removedSuggestedDays, isCalculating } = useHolidaysStore(
		useShallow((state) => ({
			currentSelection: state.currentSelection,
			suggestion: state.suggestion,
			manuallySelectedDays: state.manuallySelectedDays,
			removedSuggestedDays: state.removedSuggestedDays,
			isCalculating: state.isCalculating,
		})),
	);
	const ptoDays = useFiltersStore((state) => state.ptoDays);

	const budget = measureBudget({
		ptoDays,
		days: (currentSelection ?? suggestion)?.days,
		manuallySelectedDays,
		removedSuggestedDays,
	});

	const lastSettledRemaining = useRef(budget.remaining);
	useEffect(() => {
		if (!isCalculating) lastSettledRemaining.current = budget.remaining;
	});

	return {
		ptoDays,
		suggested: budget.suggested,
		manual: budget.manual,
		spent: budget.spent,
		remaining: isCalculating ? lastSettledRemaining.current : budget.remaining,
		hasManualChanges: budget.manual > 0 || removedSuggestedDays.length > 0,
	};
};

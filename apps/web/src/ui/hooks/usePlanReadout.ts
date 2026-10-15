"use client";

import { useFiltersStore } from "@application/stores/filters";
import { useHolidaysStore } from "@application/stores/holidays";
import type { MeasuredSuggestion } from "@domain/calendar/types";
import { type BudgetMeasure, measureBudget } from "@domain/calendar/utils/budget";
import { resolveSelectedDays } from "@domain/calendar/utils/selection";
import { useMemo, useState } from "react";
import { useShallow } from "zustand/react/shallow";

interface PlacedPlan {
	activeSuggestion: MeasuredSuggestion | null;
	placedDays: Date[];
	manualDays: Date[];
	removedSuggestedDays: Date[];
}

export const usePlacedPlan = (): PlacedPlan => {
	const { currentSelection, suggestion, manualDays, removedSuggestedDays } = useHolidaysStore(
		useShallow((state) => ({
			currentSelection: state.currentSelection,
			suggestion: state.suggestion,
			manualDays: state.manualDays,
			removedSuggestedDays: state.removedSuggestedDays,
		})),
	);

	const activeSuggestion = currentSelection ?? suggestion;
	const placedDays = useMemo(
		() =>
			resolveSelectedDays({
				days: activeSuggestion?.days ?? [],
				manualDays,
				removedSuggestedDays,
			}),
		[activeSuggestion, manualDays, removedSuggestedDays],
	);

	return { activeSuggestion, placedDays, manualDays, removedSuggestedDays };
};

interface PlanReadout extends BudgetMeasure {
	ptoDays: number;
	hasManualChanges: boolean;
}

export const usePlanReadout = (): PlanReadout => {
	const { currentSelection, suggestion, manualDays, removedSuggestedDays, isCalculating } = useHolidaysStore(
		useShallow((state) => ({
			currentSelection: state.currentSelection,
			suggestion: state.suggestion,
			manualDays: state.manualDays,
			removedSuggestedDays: state.removedSuggestedDays,
			isCalculating: state.isCalculating,
		})),
	);
	const ptoDays = useFiltersStore((state) => state.ptoDays);

	const budget = measureBudget({
		ptoDays,
		days: (currentSelection ?? suggestion)?.days,
		manualDays,
		removedSuggestedDays,
	});

	const [lastSettledRemaining, setLastSettledRemaining] = useState(budget.remaining);
	if (!isCalculating && lastSettledRemaining !== budget.remaining) setLastSettledRemaining(budget.remaining);

	return {
		ptoDays,
		suggested: budget.suggested,
		manual: budget.manual,
		spent: budget.spent,
		remaining: isCalculating ? lastSettledRemaining : budget.remaining,
		hasManualChanges: budget.manual > 0 || removedSuggestedDays.length > 0,
	};
};

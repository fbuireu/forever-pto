'use client';

import { useFiltersStore } from '@application/stores/filters';
import { useHolidaysStore } from '@application/stores/holidays';
import { measureBudget } from '@domain/calendar/utils/budget';
import { useEffect, useRef } from 'react';
import { useShallow } from 'zustand/react/shallow';

export const usePlanReadout = () => {
  const ptoDays = useFiltersStore((state) => state.ptoDays);
  const { currentSelection, suggestion, manuallySelectedDays, removedSuggestedDays, isCalculating } =
    useHolidaysStore(
      useShallow((state) => ({
        currentSelection: state.currentSelection,
        suggestion: state.suggestion,
        manuallySelectedDays: state.manuallySelectedDays,
        removedSuggestedDays: state.removedSuggestedDays,
        isCalculating: state.isCalculating,
      }))
    );

  const activeSuggestion = currentSelection ?? suggestion;
  const budget = measureBudget({
    ptoDays,
    days: activeSuggestion?.days,
    manuallySelectedDays,
    removedSuggestedDays,
  });

  const lastSettledRemaining = useRef(budget.remaining);
  useEffect(() => {
    if (!isCalculating) lastSettledRemaining.current = budget.remaining;
  });

  return {
    activeSuggestion,
    ptoDays,
    manuallySelectedDays,
    removedSuggestedDays,
    suggested: budget.suggested,
    manual: budget.manual,
    spent: budget.spent,
    remaining: isCalculating ? lastSettledRemaining.current : budget.remaining,
    hasManualChanges: budget.manual > 0 || removedSuggestedDays.length > 0,
  };
};

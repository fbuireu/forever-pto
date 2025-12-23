import { useFiltersStore } from '@application/stores/filters';
import { useHolidaysStore } from '@application/stores/holidays';
import { useShallow } from 'zustand/react/shallow';

export const usePtoCalculations = () => {
  const ptoDays = useFiltersStore((state) => state.ptoDays);

  const { currentSelection, removedSuggestedDays, manuallySelectedDays } = useHolidaysStore(
    useShallow((state) => ({
      currentSelection: state.currentSelection,
      removedSuggestedDays: state.removedSuggestedDays,
      manuallySelectedDays: state.manuallySelectedDays,
    }))
  );

  const activeSuggestedCount = (currentSelection?.days.length || 0) - removedSuggestedDays.length;
  const manualSelectedCount = manuallySelectedDays.length;
  const remaining = ptoDays - activeSuggestedCount - manualSelectedCount;
  const hasManualChanges = manualSelectedCount > 0 || removedSuggestedDays.length > 0;

  return {
    totalPto: ptoDays,
    activeSuggestedCount,
    manualSelectedCount,
    remaining,
    hasManualChanges,
  };
};

'use client';

import { useHolidaysStore } from '@application/stores/holidays';
import type { AlternativeSelectionBaseParams } from '@application/stores/types';
import { useStoresReady } from '@ui/hooks/useStoresReady';
import { useCallback } from 'react';
import { toast } from 'sonner';
import { AlternativesManager } from 'src/components/animate-ui/ui-elements/AlternativesManager';
import { useShallow } from 'zustand/react/shallow';
import { AlternativesManagerSkeleton } from '../skeletons/AlternativesManagerSkeleton';
import { PtoStatusSkeleton } from '../skeletons/PtoStatusSkeleton';
import { PtoStatus } from './PtoStatus';

export const ManagementBar = () => {
  const { areStoresReady } = useStoresReady();
  const {
    alternatives,
    suggestion,
    currentSelection,
    setPreviewAlternativeSelection,
    setCurrentAlternativeSelection,
    previewAlternativeIndex,
    currentSelectionIndex,
    manuallySelectedDays,
    removedSuggestedDays,
  } = useHolidaysStore(
    useShallow((state) => ({
      alternatives: state.alternatives,
      suggestion: state.suggestion,
      currentSelection: state.currentSelection,
      setPreviewAlternativeSelection: state.setPreviewAlternativeSelection,
      setCurrentAlternativeSelection: state.setCurrentAlternativeSelection,
      previewAlternativeIndex: state.previewAlternativeIndex,
      currentSelectionIndex: state.currentSelectionIndex,
      manuallySelectedDays: state.manuallySelectedDays,
      removedSuggestedDays: state.removedSuggestedDays,
    }))
  );

  const handlePreviewChange = useCallback(
    (params: AlternativeSelectionBaseParams) => {
      setPreviewAlternativeSelection(params);
    },
    [setPreviewAlternativeSelection]
  );

  const handleSelectionChange = useCallback(
    (params: AlternativeSelectionBaseParams) => {
      setCurrentAlternativeSelection(params);
      toast.success('Suggestion applied successfully');
    },
    [setCurrentAlternativeSelection]
  );

  const baseSuggestions = [suggestion, ...alternatives].filter(
    (suggestion): suggestion is NonNullable<typeof suggestion> => !!suggestion
  );

  const allSuggestions = baseSuggestions.map((sug, index) =>
    index === currentSelectionIndex && currentSelection ? currentSelection : sug
  );

  const hasValidSuggestions = allSuggestions.length > 0 && allSuggestions[0].days && allSuggestions[0].days.length > 0;
  const hasValidCurrentSelection = currentSelection?.days && currentSelection.days.length > 0;

  return areStoresReady && hasValidSuggestions && hasValidCurrentSelection ? (
    <div className='flex flex-row flex-wrap justify-between gap-4 w-full sticky top-0 z-50 col-span-full'>
      <AlternativesManager
        key={previewAlternativeIndex}
        currentSelectionIndex={currentSelectionIndex}
        allSuggestions={allSuggestions}
        onSelectionChange={handleSelectionChange}
        onPreviewChange={handlePreviewChange}
        selectedIndex={previewAlternativeIndex}
      />
      <PtoStatus currentSelection={currentSelection} />
    </div>
  ) : (
    <div className='flex flex-row flex-wrap  justify-between gap-4 w-full sticky top-0 z-50 col-span-full'>
      <AlternativesManagerSkeleton />
      <PtoStatusSkeleton />
    </div>
  );
};

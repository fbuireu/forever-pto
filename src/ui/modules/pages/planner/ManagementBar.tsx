'use client';

import { useHolidaysStore } from '@application/stores/holidays';
import type { AlternativeSelectionBaseParams } from '@application/stores/types';
import { useStoresReady } from '@ui/hooks/useStoresReady';
import { AlternativesManager } from '@ui/modules/core/animate/ui-elements/AlternativesManager';
import { useTranslations } from 'next-intl';
import { useCallback } from 'react';
import { toast } from 'sonner';
import { useShallow } from 'zustand/react/shallow';
import { AlternativesManagerSkeleton } from './calendar/AlternativesManagerSkeleton';
import { PtoStatus } from './PtoStatus';
import { PtoStatusSkeleton } from './PtoStatusSkeleton';

export const ManagementBar = () => {
  const t = useTranslations('toasts');
  const { areStoresReady } = useStoresReady();
  const {
    alternatives,
    suggestion,
    currentSelection,
    setPreviewAlternativeSelection,
    setCurrentAlternativeSelection,
    previewAlternativeIndex,
    currentSelectionIndex,
  } = useHolidaysStore(
    useShallow((state) => ({
      alternatives: state.alternatives,
      suggestion: state.suggestion,
      currentSelection: state.currentSelection,
      setPreviewAlternativeSelection: state.setPreviewAlternativeSelection,
      setCurrentAlternativeSelection: state.setCurrentAlternativeSelection,
      previewAlternativeIndex: state.previewAlternativeIndex,
      currentSelectionIndex: state.currentSelectionIndex,
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
      toast.success(t('suggestionApplied'));
    },
    [setCurrentAlternativeSelection, t]
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
    <div className='flex flex-row flex-wrap justify-between gap-4 w-full sticky top-3 z-50 col-span-full'>
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
    <div className='flex flex-row flex-wrap justify-between gap-4 w-full sticky top-3 z-50 col-span-full'>
      <AlternativesManagerSkeleton />
      <PtoStatusSkeleton />
    </div>
  );
};

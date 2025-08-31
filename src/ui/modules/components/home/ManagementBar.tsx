'use client';

import { useHolidaysStore } from '@application/stores/holidays';
import type { Suggestion } from '@infrastructure/services/calendar/types';
import { useStoresReady } from '@ui/hooks/useStoresReady';
import { useCallback } from 'react';
import { AlternativesManager } from 'src/components/animate-ui/ui-elements/AlternativesManager';
import { AlternativesManagerSkeleton } from '../skeletons/AlternativesManagerSkeleton';

export const ManagementBar = () => {
  const { isReady } = useStoresReady();
  const {
    alternatives,
    suggestion,
    setPreviewAlternativeSelection,
    setCurrentAlternativeSelection,
    previewAlternativeIndex,
    currentSelectionIndex,
  } = useHolidaysStore();

  const handlePreviewChange = useCallback(
    (selection: Suggestion, index: number) => {
      setPreviewAlternativeSelection(selection, index);
    },
    [setPreviewAlternativeSelection]
  );

  const handleSelectionChange = useCallback(
    (selection: Suggestion, index: number) => {
      setCurrentAlternativeSelection(selection, index);
    },
    [setCurrentAlternativeSelection]
  );

  return isReady ? (
    <AlternativesManager
      key={previewAlternativeIndex}
      currentSelectionIndex={currentSelectionIndex}
      allSuggestions={[suggestion, ...alternatives]}
      onSelectionChange={handleSelectionChange}
      onPreviewChange={handlePreviewChange}
      selectedIndex={previewAlternativeIndex}
    />
  ) : (
    <AlternativesManagerSkeleton />
  );
};

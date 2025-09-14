'use client';

import { useHolidaysStore } from '@application/stores/holidays';
import { useStoresReady } from '@ui/hooks/useStoresReady';
import { useCallback } from 'react';
import { AlternativesManager } from 'src/components/animate-ui/ui-elements/AlternativesManager';
import { AlternativesManagerSkeleton } from '../skeletons/AlternativesManagerSkeleton';
import type { AlternativeSelectionBaseParams } from '@application/stores/types';

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
    (params: AlternativeSelectionBaseParams) => {
      setPreviewAlternativeSelection(params);
    },
    [setPreviewAlternativeSelection]
  );

  const handleSelectionChange = useCallback(
    (params: AlternativeSelectionBaseParams) => {
      setCurrentAlternativeSelection(params);
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

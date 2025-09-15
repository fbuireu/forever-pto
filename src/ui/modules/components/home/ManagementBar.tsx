'use client';

import { useHolidaysStore } from '@application/stores/holidays';
import type { AlternativeSelectionBaseParams } from '@application/stores/types';
import { useStoresReady } from '@ui/hooks/useStoresReady';
import { useCallback } from 'react';
import { toast } from 'sonner';
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
    (params: AlternativeSelectionBaseParams) => {
      setPreviewAlternativeSelection(params);
    },
    [setPreviewAlternativeSelection]
  );

  const handleSelectionChange = useCallback(
    (params: AlternativeSelectionBaseParams) => {
      setCurrentAlternativeSelection(params);
      toast.success('Suggestion applied successfully', {
        description: `Selected combination with ${params.suggestion?.days.length} PTO days`,
        duration: 2000,
      });
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

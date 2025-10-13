'use client';

import type { AlternativeSelectionBaseParams } from '@application/stores/types';
import { useStoresReady } from '@ui/hooks/useStoresReady';
import { useCallback } from 'react';
import { toast } from 'sonner';
import { AlternativesManager } from 'src/components/animate-ui/ui-elements/AlternativesManager';
import { AlternativesManagerSkeleton } from '../skeletons/AlternativesManagerSkeleton';
import { useHolidaysStore } from '@application/stores/holidays';
import { useShallow } from 'zustand/react/shallow';

export const ManagementBar = () => {
  const { areStoresReady } = useStoresReady();
  const {
    alternatives,
    suggestion,
    setPreviewAlternativeSelection,
    setCurrentAlternativeSelection,
    previewAlternativeIndex,
    currentSelectionIndex,
  } = useHolidaysStore(
    useShallow((state) => ({
      alternatives: state.alternatives,
      suggestion: state.suggestion,
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
      toast.success('Suggestion applied successfully');
    },
    [setCurrentAlternativeSelection]
  );

  return areStoresReady ? (
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

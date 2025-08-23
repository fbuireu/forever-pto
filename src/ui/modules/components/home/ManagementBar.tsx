'use client';

import { useHolidaysStore } from '@application/stores/holidays';
import { Suggestion } from '@infrastructure/services/calendar/types';
import { useCallback } from 'react';
import { AlternativesManager } from 'src/components/animate-ui/ui-elements/AlternativesManager';

export const ManagementBar = () => {
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
      setCurrentAlternativeSelection(selection, index);
    },
    [setCurrentAlternativeSelection]
  );

    if (!suggestion) return null;
    
  return (
    <AlternativesManager
      key={previewAlternativeIndex}
      currentSelectionIndex={currentSelectionIndex}
      allSuggestions={[suggestion, ...alternatives]}
      onSelectionChange={handleSelectionChange}
      onPreviewChange={handlePreviewChange}
      selectedIndex={previewAlternativeIndex}
    />
  );
};

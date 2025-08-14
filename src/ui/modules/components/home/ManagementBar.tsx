'use client';

import { useHolidaysStore } from '@application/stores/holidays';
import { Suggestion } from '@infrastructure/services/calendar/suggestions/types';
import { useCallback } from 'react';
import { AlternativesManager } from 'src/components/animate-ui/ui-elements/management-bar';

export const ManagementBar = () => {
  const {
    alternatives,
    suggestion,
    setCurrentSelection,
    setTemporalSelection,
    temporalSelectionIndex,
  } = useHolidaysStore();

  const handlePreviewChange = useCallback(
    (selection: Suggestion, index: number) => {
      setTemporalSelection(selection, index);
    },
    [setTemporalSelection]
  );

  const handleSelectionChange = useCallback(
    (selection: Suggestion, index: number) => {
      setCurrentSelection(selection, index);
    },
    [setCurrentSelection]
  );

  if (!suggestion) return null;

  return (
    <AlternativesManager
      alternatives={alternatives}
      suggestion={suggestion}
      onSelectionChange={handleSelectionChange}
      onPreviewChange={handlePreviewChange}
      selectedIndex={temporalSelectionIndex}
    />
  );
};

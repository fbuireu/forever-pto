'use client';

import { useHolidaysStore } from '@application/stores/holidays';
import type { GenerateSuggestionsParams } from '@application/stores/types';
import type {
  CalculateSuggestionsRequest,
  WorkerResponse,
} from '@infrastructure/workers/calculations/calculations.types';
import {
  deserializeSuggestion,
  serializeHolidays,
  serializeMonths,
} from '@infrastructure/workers/calculations/serializers';
import { useCallback, useEffect, useRef } from 'react';
import { useShallow } from 'zustand/react/shallow';

export function useCalculationsWorker() {
  const workerRef = useRef<Worker | null>(null);
  const currentRequestIdRef = useRef<string>('');

  const { setCalculating, setCalculationResult, holidays, maxAlternatives, manuallySelectedDays } = useHolidaysStore(
    useShallow((state) => ({
      setCalculating: state.setCalculating,
      setCalculationResult: state.setCalculationResult,
      holidays: state.holidays,
      maxAlternatives: state.maxAlternatives,
      manuallySelectedDays: state.manuallySelectedDays,
    }))
  );

  const triggerCalculation = useCallback(
    (params: GenerateSuggestionsParams) => {
      workerRef.current?.terminate();

      const worker = new Worker(
        new URL('../../infrastructure/workers/calculations/calculations.worker', import.meta.url)
      );
      workerRef.current = worker;

      const requestId = String(Date.now());
      currentRequestIdRef.current = requestId;

      setCalculating(true);

      worker.onmessage = (e: MessageEvent<WorkerResponse>) => {
        if (e.data.requestId !== currentRequestIdRef.current) return;
        setCalculating(false);
        if (e.data.type === 'CALCULATE_SUGGESTIONS_RESULT') {
          const { suggestion, alternatives } = e.data.payload;
          setCalculationResult({
            suggestion: deserializeSuggestion(suggestion),
            alternatives: alternatives.map(deserializeSuggestion),
          });
        }
      };

      worker.onerror = () => {
        if (currentRequestIdRef.current === requestId) {
          setCalculating(false);
        }
      };

      const request: CalculateSuggestionsRequest = {
        type: 'CALCULATE_SUGGESTIONS',
        requestId,
        payload: {
          year: params.year,
          ptoDays: params.ptoDays,
          holidays: serializeHolidays(holidays),
          allowPastDays: params.allowPastDays,
          months: serializeMonths(params.months),
          strategy: params.strategy,
          locale: params.locale,
          maxAlternatives,
          manualDays: manuallySelectedDays.map((d) => d.toISOString()),
          ...(() => {
            const { currentSelection, removedSuggestedDays } = useHolidaysStore.getState();
            const activeSuggestedDays = currentSelection
              ? Math.max(0, currentSelection.days.length - removedSuggestedDays.length)
              : undefined;
            const budgetForAutoSuggest = params.ptoDays - manuallySelectedDays.length;
            return {
              excludedDays: removedSuggestedDays.map((d) => d.toISOString()),
              autoSuggestCount:
                activeSuggestedDays !== undefined
                  ? Math.min(budgetForAutoSuggest, activeSuggestedDays)
                  : undefined,
            };
          })(),
        },
      };

      worker.postMessage(request);
    },
    [setCalculating, setCalculationResult, holidays, maxAlternatives, manuallySelectedDays]
  );

  useEffect(() => {
    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  return { triggerCalculation };
}

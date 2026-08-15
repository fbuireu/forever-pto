import { fromStoredInstant } from '@application/shared/utils/dateIntake';
import { runPlanningPipeline } from '@domain/calendar/pipeline';
import type { FilterStrategy } from '@domain/calendar/types';
import { type CalculateSuggestionsRequest, WORKER_MESSAGE_TYPE, type WorkerResponse } from './types';
import { deserializeHolidays, deserializeMonths, serializeSuggestionResult } from './utils/serializers';

globalThis.onmessage = (e: MessageEvent<CalculateSuggestionsRequest>) => {
  const { type, requestId, payload } = e.data;

  if (type !== WORKER_MESSAGE_TYPE.CALCULATE_SUGGESTIONS) return;

  const {
    year,
    ptoDays,
    holidays: rawHolidays,
    allowPastDays,
    months: rawMonths,
    strategy,
    locale,
    maxAlternatives,
    manualDays = [],
    removedDays = [],
    autoSuggestCount,
  } = payload;

  try {
    const { suggestion, alternatives } = runPlanningPipeline({
      year,
      ptoDays,
      autoSuggestCount,
      holidays: deserializeHolidays(rawHolidays),
      manuallySelectedDays: manualDays.map(fromStoredInstant),
      removedSuggestedDays: removedDays.map(fromStoredInstant),
      allowPastDays,
      months: deserializeMonths(rawMonths),
      strategy: strategy as FilterStrategy,
      locale,
      maxAlternatives,
    });

    const response: WorkerResponse = {
      type: WORKER_MESSAGE_TYPE.CALCULATE_SUGGESTIONS_RESULT,
      requestId,
      payload: serializeSuggestionResult(suggestion, alternatives),
    };

    self.postMessage(response);
  } catch (err) {
    const response: WorkerResponse = {
      type: WORKER_MESSAGE_TYPE.WORKER_ERROR,
      requestId,
      error: String(err),
    };
    self.postMessage(response);
  }
};

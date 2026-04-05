import { generateAlternatives } from '../../services/calendar/alternatives/generateAlternatives';
import { generateMetrics } from '../../services/calendar/metrics/generateMetrics';
import { generateSuggestions } from '../../services/calendar/suggestions/generateSuggestions';
import type { FilterStrategy } from '../../services/calendar/types';
import { HolidayVariant } from '../../../application/dto/holiday/types';
import type { CalculateSuggestionsRequest, WorkerResponse } from './calculations.types';
import { deserializeHolidays, deserializeMonths, serializeSuggestionResult } from './serializers';

self.onmessage = (e: MessageEvent<CalculateSuggestionsRequest>) => {
  const { type, requestId, payload } = e.data;

  if (type !== 'CALCULATE_SUGGESTIONS') return;

  const { year, ptoDays, holidays: rawHolidays, allowPastDays, months: rawMonths, strategy, locale, maxAlternatives, manualDays = [] } =
    payload;

  try {
    const holidays = deserializeHolidays(rawHolidays);
    const months = deserializeMonths(rawMonths);

    // Treat manually selected days as pseudo-holidays so the algorithm:
    // 1. Excludes them from the available workday pool
    // 2. Extends bridges through/adjacent to the manual block
    const manualPseudoHolidays = manualDays.map((isoDate, i) => ({
      id: `manual-${i}`,
      date: new Date(isoDate),
      name: 'Manual day',
      variant: HolidayVariant.CUSTOM,
      isInSelectedRange: true,
    }));
    const holidaysWithManual = [...holidays, ...manualPseudoHolidays];
    const effectivePtoDays = Math.max(0, ptoDays - manualDays.length);

    if (effectivePtoDays <= 0 || holidaysWithManual.length === 0) {
      const response: WorkerResponse = {
        type: 'CALCULATE_SUGGESTIONS_RESULT',
        requestId,
        payload: { suggestion: { days: [] }, alternatives: [] },
      };
      self.postMessage(response);
      return;
    }

    const typedStrategy = strategy as FilterStrategy;

    const baseSuggestion = generateSuggestions({ year, ptoDays: effectivePtoDays, holidays: holidaysWithManual, allowPastDays, months, strategy: typedStrategy });

    const baseAlternatives = generateAlternatives({
      year,
      ptoDays: effectivePtoDays,
      holidays: holidaysWithManual,
      allowPastDays,
      months,
      maxAlternatives,
      existingSuggestion: baseSuggestion.days,
      strategy: typedStrategy,
    });

    const suggestion = {
      ...baseSuggestion,
      metrics: generateMetrics({ suggestion: baseSuggestion, locale, bridges: baseSuggestion.bridges, holidays: holidaysWithManual, allowPastDays }),
    };

    const alternatives = baseAlternatives.map((alt) => ({
      ...alt,
      metrics: generateMetrics({ suggestion: alt, locale, bridges: alt.bridges, holidays: holidaysWithManual, allowPastDays }),
    }));

    const response: WorkerResponse = {
      type: 'CALCULATE_SUGGESTIONS_RESULT',
      requestId,
      payload: serializeSuggestionResult(suggestion, alternatives),
    };

    self.postMessage(response);
  } catch (err) {
    const response: WorkerResponse = {
      type: 'WORKER_ERROR',
      requestId,
      error: String(err),
    };
    self.postMessage(response);
  }
};

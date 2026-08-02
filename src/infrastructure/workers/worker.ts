import { HolidayVariant } from '@application/dto/holiday/types';
import { generateAlternatives } from '@domain/calendar/alternatives/generateAlternatives';
import { generateMetrics } from '@domain/calendar/metrics/generateMetrics';
import { generateSuggestions } from '@domain/calendar/suggestions/generateSuggestions';
import type { FilterStrategy, Metrics } from '@domain/calendar/types';
import { clearDateKeyCache, clearHolidayCache } from '@domain/calendar/utils/cache';
import { type CalculateSuggestionsRequest, WORKER_MESSAGE_TYPE, type WorkerResponse } from './types';
import { deserializeHolidays, deserializeMonths, serializeSuggestionResult } from './utils/serializers';

const EMPTY_METRICS: Metrics = {
  longWeekends: 0,
  restBlocks: 0,
  maxWorkStreak: 0,
  firstLastBreak: null,
  averageEfficiency: 0,
  bonusDays: 0,
  quarterDist: [0, 0, 0, 0],
  bridgesUsed: 0,
  workedDaysPerMonth: 0,
  totalEffectiveDays: 0,
  monthlyDist: Array.from({ length: 12 }, () => 0),
  longBlocksPerQuarter: [0, 0, 0, 0],
  longestVacation: 0,
};

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
    clearDateKeyCache();
    clearHolidayCache();

    const holidays = deserializeHolidays(rawHolidays);
    const months = deserializeMonths(rawMonths);

    const manualPseudoHolidays = manualDays.map((isoDate, i) => ({
      id: `manual-${i}`,
      date: new Date(isoDate),
      name: 'Manual day',
      variant: HolidayVariant.CUSTOM,
      isInSelectedRange: true,
    }));
    const holidaysWithManual = [...holidays, ...manualPseudoHolidays];
    const manualDates = manualPseudoHolidays.map((h) => h.date);
    const removedDates = removedDays.map((isoDate) => new Date(isoDate));
    const effectivePtoDays = Math.max(0, autoSuggestCount ?? ptoDays - manualDays.length);

    if (effectivePtoDays <= 0 || holidaysWithManual.length === 0) {
      const response: WorkerResponse = {
        type: WORKER_MESSAGE_TYPE.CALCULATE_SUGGESTIONS_RESULT,
        requestId,
        payload: { suggestion: { days: [], metrics: EMPTY_METRICS }, alternatives: [] },
      };
      self.postMessage(response);
      return;
    }

    const typedStrategy = strategy as FilterStrategy;

    const baseSuggestion = generateSuggestions({
      ptoDays: effectivePtoDays,
      holidays: holidaysWithManual,
      allowPastDays,
      months,
      strategy: typedStrategy,
      removedDays: removedDates,
    });

    const baseAlternatives = generateAlternatives({
      ptoDays: effectivePtoDays,
      holidays: holidaysWithManual,
      allowPastDays,
      months,
      maxAlternatives,
      existingSuggestion: baseSuggestion.days,
      strategy: typedStrategy,
      removedDays: removedDates,
    });

    const suggestion = {
      ...baseSuggestion,
      metrics: generateMetrics({
        suggestion: baseSuggestion,
        locale,
        year,
        bridges: baseSuggestion.bridges,
        holidays: holidaysWithManual,
        allowPastDays,
        manuallySelectedDays: manualDates,
        removedSuggestedDays: removedDates,
      }),
    };

    const alternatives = baseAlternatives.map((alternative) => ({
      ...alternative,
      metrics: generateMetrics({
        suggestion: alternative,
        locale,
        year,
        bridges: alternative.bridges,
        holidays: holidaysWithManual,
        allowPastDays,
        manuallySelectedDays: manualDates,
        removedSuggestedDays: removedDates,
      }),
    }));

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

import type { Metrics } from '@domain/calendar/types';

export interface SerializedHolidayDTO {
  id: string;
  date: string;
  name: string;
  type?: string;
  location?: string;
  variant: string;
  isInSelectedRange: boolean;
}

export interface SerializedBridge {
  startDate: string;
  endDate: string;
  ptoDaysNeeded: number;
  effectiveDays: number;
  efficiency: number;
  ptoDays: string[];
}

export interface SerializedSuggestion {
  days: string[];
  bridges?: SerializedBridge[];
  strategy?: string;
  metrics?: Metrics;
}

interface CalculateSuggestionsPayload {
  year: number;
  ptoDays: number;
  holidays: SerializedHolidayDTO[];
  allowPastDays: boolean;
  months: string[];
  strategy: string;
  locale: string;
  maxAlternatives: number;
  manualDays: string[];
  excludedDays?: string[];
  autoSuggestCount?: number;
}

export interface CalculateSuggestionsRequest {
  type: 'CALCULATE_SUGGESTIONS';
  requestId: string;
  payload: CalculateSuggestionsPayload;
}

interface CalculateSuggestionsResultPayload {
  suggestion: SerializedSuggestion;
  alternatives: SerializedSuggestion[];
}

interface CalculateSuggestionsResponse {
  type: 'CALCULATE_SUGGESTIONS_RESULT';
  requestId: string;
  payload: CalculateSuggestionsResultPayload;
}

interface WorkerErrorResponse {
  type: 'WORKER_ERROR';
  requestId: string;
  error: string;
}

export type WorkerResponse = CalculateSuggestionsResponse | WorkerErrorResponse;

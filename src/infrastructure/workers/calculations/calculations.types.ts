import type { Metrics } from '../../services/calendar/types';

export interface SerializedHolidayDTO {
  id: string;
  date: string; // ISO
  name: string;
  type?: string;
  location?: string;
  variant: string;
  isInSelectedRange: boolean;
}

export interface SerializedBridge {
  startDate: string; // ISO
  endDate: string; // ISO
  ptoDaysNeeded: number;
  effectiveDays: number;
  efficiency: number;
  ptoDays: string[]; // ISO[]
}

export interface SerializedSuggestion {
  days: string[]; // ISO[]
  bridges?: SerializedBridge[];
  strategy?: string;
  metrics?: Metrics;
}

export interface CalculateSuggestionsPayload {
  year: number;
  ptoDays: number;
  holidays: SerializedHolidayDTO[];
  allowPastDays: boolean;
  months: string[]; // ISO[]
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

export interface CalculateSuggestionsResultPayload {
  suggestion: SerializedSuggestion;
  alternatives: SerializedSuggestion[];
}

export interface CalculateSuggestionsResponse {
  type: 'CALCULATE_SUGGESTIONS_RESULT';
  requestId: string;
  payload: CalculateSuggestionsResultPayload;
}

export interface WorkerErrorResponse {
  type: 'WORKER_ERROR';
  requestId: string;
  error: string;
}

export type WorkerResponse = CalculateSuggestionsResponse | WorkerErrorResponse;

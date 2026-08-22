import type { Metrics } from "@domain/calendar/types";

type DateFields<T> = {
	[KEY in keyof T]-?: NonNullable<T[KEY]> extends Date
		? KEY
		: NonNullable<T[KEY]> extends readonly unknown[] | string | number | boolean
			? never
			: NonNullable<T[KEY]> extends object
				? DateFields<NonNullable<T[KEY]>> extends never
					? never
					: KEY
				: never;
}[keyof T];

type Assert<CLEAN extends true> = CLEAN;

export type MetricsHoldNoDate = Assert<DateFields<Metrics> extends never ? true : DateFields<Metrics>>;

export const WORKER_MESSAGE_TYPE = {
	CALCULATE_SUGGESTIONS: "CALCULATE_SUGGESTIONS",
	CALCULATE_SUGGESTIONS_RESULT: "CALCULATE_SUGGESTIONS_RESULT",
	WORKER_ERROR: "WORKER_ERROR",
} as const;

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
	metrics: Metrics;
}

interface CalculateSuggestionsPayload {
	year: number;
	carryOverMonths: number;
	ptoDays: number;
	holidays: SerializedHolidayDTO[];
	allowPastDays: boolean;
	strategy: string;
	locale: string;
	maxAlternatives: number;
	manualDays: string[];
	removedDays?: string[];
	autoSuggestCount?: number;
}

export interface CalculateSuggestionsRequest {
	type: typeof WORKER_MESSAGE_TYPE.CALCULATE_SUGGESTIONS;
	requestId: string;
	payload: CalculateSuggestionsPayload;
}

interface CalculateSuggestionsResultPayload {
	suggestion: SerializedSuggestion;
	alternatives: SerializedSuggestion[];
}

interface CalculateSuggestionsResponse {
	type: typeof WORKER_MESSAGE_TYPE.CALCULATE_SUGGESTIONS_RESULT;
	requestId: string;
	payload: CalculateSuggestionsResultPayload;
}

interface WorkerErrorResponse {
	type: typeof WORKER_MESSAGE_TYPE.WORKER_ERROR;
	requestId: string;
	error: string;
}

export type WorkerResponse = CalculateSuggestionsResponse | WorkerErrorResponse;

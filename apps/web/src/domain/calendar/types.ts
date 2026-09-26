import { MONTHS_IN_YEAR } from "./window";

export interface Bridge {
	startDate: Date;
	endDate: Date;
	ptoDaysNeeded: number;
	effectiveDays: number;
	efficiency: number;
	ptoDays: Date[];
}

export interface Suggestion {
	days: Date[];
	bridges?: Bridge[];
	strategy?: FilterStrategy;
	metrics?: Metrics;
}

export type MeasuredSuggestion = Suggestion & { metrics: Metrics };

export const FilterStrategy = {
	GROUPED: "grouped",
	OPTIMIZED: "optimized",
	BALANCED: "balanced",
	MAIN_VACATION: "mainVacation",
} as const;

export type FilterStrategy = (typeof FilterStrategy)[keyof typeof FilterStrategy];

export const DEFAULT_FILTER_STRATEGY: FilterStrategy = FilterStrategy.GROUPED;

export const DEFAULT_PREFERRED_MONTHS: readonly number[] = [6, 7];

export const isPreferredMonths = (value: unknown): value is number[] =>
	Array.isArray(value) &&
	new Set(value).size === value.length &&
	value.every((month) => Number.isInteger(month) && month >= 0 && month < MONTHS_IN_YEAR);

export const isFilterStrategy = (value: unknown): value is FilterStrategy =>
	Object.values(FilterStrategy).includes(value as FilterStrategy);

export interface FirstLastBreak {
	first: string;
	last: string;
}

export interface Metrics {
	longWeekends: number;
	restBlocks: number;
	maxWorkStreak: number;
	firstLastBreak: FirstLastBreak | null;
	averageEfficiency: number;
	bonusDays: number;
	quarterDist: number[];
	bridgesUsed: number;
	workedDaysPerMonth: number;
	totalEffectiveDays: number;
	monthlyDist: number[];
	longBlocksPerQuarter: number[];
	longestVacation: number;
}

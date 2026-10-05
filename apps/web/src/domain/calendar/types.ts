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
	strategy?: Strategy;
	metrics?: Metrics;
}

export type MeasuredSuggestion = Suggestion & { metrics: Metrics };

export const Strategy = {
	GROUPED: "grouped",
	OPTIMIZED: "optimized",
	BALANCED: "balanced",
	MAIN_VACATION: "mainVacation",
} as const;

export type Strategy = (typeof Strategy)[keyof typeof Strategy];

export const DEFAULT_STRATEGY: Strategy = Strategy.GROUPED;

export const isStrategy = (value: unknown): value is Strategy => Object.values(Strategy).includes(value as Strategy);

export interface FirstLastRestBlock {
	first: string;
	last: string;
}

export interface Metrics {
	longWeekends: number;
	restBlocks: number;
	maxWorkStreak: number;
	firstLastRestBlock: FirstLastRestBlock | null;
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

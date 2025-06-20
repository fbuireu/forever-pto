import type { CapitalizeKeys } from "@const/types";
import type { CalendarLimits, ScoreMultipliers } from "@modules/components/home/components/calendarList/hooks/types";

export const DEFAULT_CALENDAR_LIMITS: CapitalizeKeys<CalendarLimits> = {
	MAX_BLOCK_SIZE: 5,
	MAX_SEARCH_DEPTH: 10,
	MAX_ALTERNATIVES: 10,
} as const;

export const SCORE_MULTIPLIERS: CapitalizeKeys<ScoreMultipliers> = {
	DEFAULT: 1.0,
	CONSECUTIVE_DAYS: {
		THRESHOLD: 5,
	},
	EFFICIENCY_RATIO: {
		HIGH: 3,
		MEDIUM: 2,
	},
	BONUS: {
		HIGH_EFFICIENCY: 1.3,
		MEDIUM_EFFICIENCY: 1.2,
		LONG_SEQUENCE: 1.2,
	},
	TOLERANCE: {
		SINGLE_DAY: 1,
		MULTI_DAY: 2,
		SCORE_DIFFERENCE: 0.1,
	},
	SELECTION: {
		HIGH_EFFICIENCY_THRESHOLD: 1.5,
		HOLIDAY_BENEFIT_THRESHOLD: 1.0,
		BENEFIT_ALTERNATIVE_THRESHOLD: 1.2,
		BLOCK_SIZE_DIFFERENCE: 1,
		EFFICIENCY_DIFFERENCE: 0.2,
		SCORE_DIFFERENCE: 0.1,
		MIN_SCORE_PER_DAY: 2.5,
		MIN_MULTI_DAY_SIZE: 2,
	},
} as const;

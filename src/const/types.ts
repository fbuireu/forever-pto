import { SEARCH_PARAM_KEYS } from "@const/const";
import type { NextRequest } from "next/server";

export type CapitalizeKeys<T> = {
	[K in keyof T as Uppercase<K & string>]: T[K] extends object ? CapitalizeKeys<T[K]> : T[K];
};

export type LowercaseKeys<T> = {
	[K in keyof T as Lowercase<K & string>]: T[K] extends object ? LowercaseKeys<T[K]> : T[K];
};

export type Except<T, K extends keyof T> = {
	[P in keyof T as P extends K ? never : P]: T[P];
};

export interface SearchParams {
	[SEARCH_PARAM_KEYS.COUNTRY]?: string;
	[SEARCH_PARAM_KEYS.REGION]?: string;
	[SEARCH_PARAM_KEYS.YEAR]: string;
	[SEARCH_PARAM_KEYS.PTO_DAYS]: string;
	[SEARCH_PARAM_KEYS.ALLOW_PAST_DAYS]: string;
	[SEARCH_PARAM_KEYS.CARRY_OVER_MONTHS]: string;
}

export interface PremiumParams {
	cookie_name: "premium";
	duration: number;
	check_delay: number;
}

export interface KofiWidget {
	username: string;
	type: "floating-chat";
	donate_button: {
		text: string;
		text_color: string;
	};
}

export interface CalendarLimits {
	max_block_size: number;
	max_search_depth: number;
	max_alternatives: number;
}

export interface ScoreMultipliers {
	default: number;
	consecutive_days: {
		threshold: number;
	};
	efficiency_ratio: {
		high: number;
		medium: number;
	};
	bonus: {
		high_efficiency: number;
		medium_efficiency: number;
		long_sequence: number;
	};
	tolerance: {
		single_day: number;
		multi_day: number;
	};
}

export interface FilterMaximumValues {
	carry_over_months: {
		free: number;
		premium: number;
	};
	years: (year: string) => number[];
}

export type RequiredParamsMap = {
	[K in keyof SearchParams]?: (request: NextRequest) => string | Promise<string>;
};

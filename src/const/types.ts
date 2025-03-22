import { SEARCH_PARAM_KEYS } from '@const/const';
import type { NextRequest } from 'next/server';

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

export interface FilterMaximumValues {
	CARRY_OVER_MONTHS: {
		FREE: number;
		PREMIUM: number;
	};
	YEARS: (year: string) => number[];
}

export type RequiredParamsMap = {
	[K in keyof SearchParams]?: (request: NextRequest) => string | Promise<string>;
};

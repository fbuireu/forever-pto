import { SEARCH_PARAM_KEYS } from "@const/const";
import type { defineRouting } from "next-intl/routing";

export type CapitalizeKeys<T, Shallow extends boolean = false> = {
	[K in keyof T as Uppercase<string & K>]: T[K] extends readonly unknown[]
		? T[K]
		: T[K] extends object
			? Shallow extends true
				? T[K]
				: CapitalizeKeys<T[K], Shallow>
			: T[K];
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
	cookie_duration: number;
}

export interface I18nConfig extends Except<ReturnType<typeof defineRouting>, "defaultLocale"> {
	locales: readonly ["en", "es", "ca", "it"];
	cookie_name: "NEXT_LOCALE";
	default_locale: typeof defineRouting extends { defaultLocale: infer D } ? D : "en";
	locale_detection: ReturnType<typeof defineRouting>["localeDetection"];
	locale_prefix: ReturnType<typeof defineRouting>["localePrefix"];
}

import type { CapitalizeKeys, I18nConfig, PremiumParams } from "@const/types";
import { capitalizeKeys } from "./utils/capitalizeKeys/capitalizeKeys";

export const SEARCH_PARAM_KEYS = {
	COUNTRY: "country",
	REGION: "region",
	YEAR: "year",
	PTO_DAYS: "ptoDays",
	ALLOW_PAST_DAYS: "allowPastDays",
	CARRY_OVER_MONTHS: "carryOverMonths",
} as const;

const Pages = {
	HOME: "home",
} as const;

const pagesRoutes = {
	[Pages.HOME]: "/",
} as const;

export const PAGES_ROUTES: CapitalizeKeys<typeof pagesRoutes> = capitalizeKeys(pagesRoutes);

export const DEFAULT_QUERY_PARAMS: Record<CapitalizeKeys<string>, string> = {
	YEAR: String(new Date().getFullYear()),
	PTO_DAYS: "22",
	ALLOW_PAST_DAYS: "false",
	CARRY_OVER_MONTHS: "1",
} as const;

export const I18N_CONFIG: CapitalizeKeys<I18nConfig> = {
	LOCALES: ["en", "es", "ca", "it"] as const,
	DEFAULT_LOCALE: "en" as const,
	LOCALE_DETECTION: true,
	LOCALE_PREFIX: "always" as const,
	PATHNAMES: {},
	COOKIE_NAME: "NEXT_LOCALE" as const,
} as const;

export const PREMIUM_PARAMS: CapitalizeKeys<PremiumParams> = {
	COOKIE_NAME: "premium" as const,
	COOKIE_DURATION: 30 * 24 * 60 * 60,
	CHECK_DELAY: 5 * 60 * 1000,
} as const;

export const THEME_STORAGE_KEY: string = "theme" as const;

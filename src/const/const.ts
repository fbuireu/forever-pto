import type {
	CalendarLimits,
	CapitalizeKeys,
	FilterMaximumValues,
	PremiumParams,
	ScoreMultipliers,
} from "@const/types";
import { capitalizeKeys } from "@const/utils/capitalizeKeys/capitalizeKeys";
import type { Metadata } from "next";

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
};

export const DEFAULT_SIDEBAR_CONFIG: Record<CapitalizeKeys<string>, string | number> = {
	SIDEBAR_COOKIE_NAME: "sidebar_state",
	SIDEBAR_COOKIE_MAX_AGE: 60 * 60 * 24 * 7,
	SIDEBAR_WIDTH: "20rem",
	SIDEBAR_WIDTH_MOBILE: "18rem",
	SIDEBAR_WIDTH_ICON: "3rem",
	SIDEBAR_KEYBOARD_SHORTCUT: "b",
};

export const DEFAULT_SEO_PARAMS: CapitalizeKeys<Metadata> = {
	TITLE: "",
	SITE: "",
	DESCRIPTION: "Welcome to my website!",
	ROBOTS: {
		INDEX: true,
		FOLLOW: true,
	},
	IMAGE: "",
} as unknown as CapitalizeKeys<Metadata>;

export const DEFAULT_CALENDAR_LIMITS: CapitalizeKeys<CalendarLimits> = {
	MAX_BLOCK_SIZE: 5,
	MAX_SEARCH_DEPTH: 10,
	MAX_ALTERNATIVES: 5,
	MAX_CANDIDATE_ALTERNATIVES: 20,
} as const;

export const SCORE_MULTIPLIERS: CapitalizeKeys<ScoreMultipliers> = {
	DEFAULT: 1.0,
	CONSECUTIVE_DAYS: {
		THRESHOLD: 5,
		MULTIPLIER: 1.2,
	},
	BLOCK_SIZE: {
		MIN: 1,
		MAX: 5,
		MULTIPLIER: 1.1,
	},
	EFFICIENCY_RATIO: {
		THRESHOLD: 1.5,
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
	},
} as const;

export const FILTER_MAXIMUM_VALUES: CapitalizeKeys<FilterMaximumValues> = {
	CARRY_OVER_MONTHS: {
		FREE: 1,
		PREMIUM: 12,
	},
	YEARS: (year: string) => Array.from({ length: 11 }, (_, i) => Number(year) - 5 + i),
};

export const PREMIUM_PARAMS: CapitalizeKeys<PremiumParams> = {
	COOKIE_NAME: "premium" as const,
	DURATION: 30 * 24 * 60 * 60,
	CHECK_DELAY: 5 * 60 * 1000,
} as const;

export const CONTACT_DETAILS: Record<CapitalizeKeys<string>, string> = {
	NAME: "",
	EMAIL_SUBJECT: "Web contact form submission",
	ENCODED_EMAIL_FROM: "",
	ENCODED_EMAIL_SELF: "",
};

export const SOCIAL_NETWORKS: Record<CapitalizeKeys<string>, string> = {
	LINKEDIN: "",
	GITHUB: "",
};

export const THEME_STORAGE_KEY: string = "theme";

export const DEFAULT_LANGUAGE = "en";

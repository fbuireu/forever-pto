import type { CapitalizeKeys, FilterMaximumValues } from '@const/types';
import { capitalizeKeys } from '@const/utils/capitalizeKeys';
import type { Metadata } from 'next';

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

export const DEFAULT_SEARCH_PARAMS: Record<CapitalizeKeys<string>, string> = {
	YEAR: String(new Date().getFullYear()),
	PTO_DAYS: "22",
	ALLOW_PAST_DAYS: "false",
	CARRY_OVER_MONTHS: "1",
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

export const FILTER_MAXIMUM_VALUES: FilterMaximumValues = {
	CARRY_OVER_MONTHS: {
		FREE: 1,
		PREMIUM: 12,
	},
	YEARS: (year: string) => Array.from({ length: 11 }, (_, i) => Number(year) - 5 + i),
};

export const CONTACT_DETAILS: Record<CapitalizeKeys<string>, string> = {
	NAME: "",
	EMAIL_SUBJECT: "Web contact form submission",
	ENCODED_EMAIL_FROM: "",
	ENCODED_EMAIL_SELF: "",
};

export const PREMIUM_COOKIE = {
	NAME: "premium",
	DURATION: 30 * 24 * 60 * 60,
};

export const SOCIAL_NETWORKS: Record<CapitalizeKeys<string>, string> = {
	LINKEDIN: "",
	GITHUB: "",
};

export const THEME_STORAGE_KEY = "theme";

export const DEFAULT_LOCALE_STRING: Intl.LocalesArgument = "es-ES";

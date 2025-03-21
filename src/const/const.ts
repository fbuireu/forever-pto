import type { CapitalizeKeys, FilterMaximumValues, RequiredParamsMap } from '@const/types';
import { capitalizeKeys } from '@const/utils/capitalizeKeys';
import { detectLocation } from '@infrastructure/services/location/detectLocation';
import type { Metadata } from 'next';
import type { NextRequest } from 'next/server';

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

export const MIDDLEWARE_PARAMS: RequiredParamsMap = {
	[SEARCH_PARAM_KEYS.COUNTRY]: async (request: NextRequest) => await detectLocation(request),
	[SEARCH_PARAM_KEYS.YEAR]: () => DEFAULT_SEARCH_PARAMS.YEAR,
	[SEARCH_PARAM_KEYS.PTO_DAYS]: () => DEFAULT_SEARCH_PARAMS.PTO_DAYS,
	[SEARCH_PARAM_KEYS.ALLOW_PAST_DAYS]: () => DEFAULT_SEARCH_PARAMS.ALLOW_PAST_DAYS,
	[SEARCH_PARAM_KEYS.CARRY_OVER_MONTHS]: async (request: NextRequest) => {
		const isPremium = request.cookies.get(PREMIUM_COOKIE.NAME)?.value === "true";

		if (!isPremium) {
			return String(FILTER_MAXIMUM_VALUES.CARRY_OVER_MONTHS.FREE);
		}

		return DEFAULT_SEARCH_PARAMS.CARRY_OVER_MONTHS;
	},
};

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

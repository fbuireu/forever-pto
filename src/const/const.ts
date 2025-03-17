import type { CapitalizeKeys } from '@const/types';
import { capitalizeKeys } from '@const/utils/capitalizeKeys';
import type { Metadata } from 'next';
import type { SearchParams } from '@app/page';
import type { NextRequest } from 'next/server';
import { detectLocation } from '@infrastructure/services/location/detectLocation';

const Pages = {
  HOME: 'home',
} as const;

const pagesRoutes = {
  [Pages.HOME]: '/',
} as const;

export const PAGES_ROUTES: CapitalizeKeys<typeof pagesRoutes> = capitalizeKeys(pagesRoutes);

export const DEFAULT_SEARCH_PARAMS: Record<CapitalizeKeys<string>, string> = {
  YEAR: String(new Date().getFullYear()),
  PTO_DAYS: '22',
  ALLOW_PAST_DAYS: 'false',
  CARRY_OVER_MONTHS: '1',
};

export const DEFAULT_SEO_PARAMS: CapitalizeKeys<Metadata> = {
  TITLE: '',
  SITE: '',
  DESCRIPTION: 'Welcome to my website!',
  ROBOTS: {
    INDEX: true,
    FOLLOW: true,
  },
  IMAGE: '',
} as unknown as CapitalizeKeys<Metadata>;

type RequiredParamsMap = {
  [K in keyof SearchParams]?: (request: NextRequest) => string | Promise<string>;
};

export const MIDDLEWARE_PARAMS: RequiredParamsMap = {
  country: async (request: NextRequest) => await detectLocation(request),
  year: () => DEFAULT_SEARCH_PARAMS.YEAR,
  ptoDays: () => DEFAULT_SEARCH_PARAMS.PTO_DAYS,
  allowPastDays: () => DEFAULT_SEARCH_PARAMS.ALLOW_PAST_DAYS,
  carryOverMonths: async (request: NextRequest) => {
    const isPremium = request.cookies.get("premium")?.value === "true";

    if (!isPremium) {
      return "1";
    }

    return DEFAULT_SEARCH_PARAMS.CARRY_OVER_MONTHS;
  },
};

export const CONTACT_DETAILS: Record<CapitalizeKeys<string>, string> = {
  NAME: '',
  EMAIL_SUBJECT: 'Web contact form submission',
  ENCODED_EMAIL_FROM: '',
  ENCODED_EMAIL_SELF: '',
};

export const SOCIAL_NETWORKS: Record<CapitalizeKeys<string>, string> = {
  LINKEDIN: '',
  GITHUB: '',
};

export const THEME_STORAGE_KEY = 'theme';

export const DEFAULT_LOCALE_STRING: Intl.LocalesArgument = 'es-ES';

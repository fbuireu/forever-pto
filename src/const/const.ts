
const Pages = {
	HOME: "home",
} as const;

const pagesRoutes = {
	[Pages.HOME]: "/",
} as const;

export const PAGES_ROUTES: typeof pagesRoutes = pagesRoutes;

export const I18N_CONFIG = {
	LOCALES: ["en", "es", "ca", "it"] as const,
	DEFAULT_LOCALE: "en" as const,
	LOCALE_DETECTION: true,
	LOCALE_PREFIX: "always" as const,
	PATHNAMES: {},
	COOKIE_NAME: "NEXT_LOCALE" as const,
} as const;

export const PREMIUM_PARAMS = {
	COOKIE_NAME: "premium" as const,
	COOKIE_DURATION: 30 * 24 * 60 * 60,
} as const;

export const THEME_STORAGE_KEY: string = "theme" as const;

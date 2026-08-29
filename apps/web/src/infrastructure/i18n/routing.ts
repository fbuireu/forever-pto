import { defineRouting } from "next-intl/routing";
import { LOCALE_COOKIE_POLICY } from "./cookie";
import { EN, LOCALES } from "./locales";

export const routing = defineRouting({
	locales: LOCALES,
	defaultLocale: EN,
	localePrefix: "as-needed",
	localeCookie: LOCALE_COOKIE_POLICY,
});

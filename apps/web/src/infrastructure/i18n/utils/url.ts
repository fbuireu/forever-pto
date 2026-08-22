import { hasLocale, type Locale } from "next-intl";
import { LOCALES } from "../locales";
import { routing } from "../routing";

export function localePath(locale: string, path = "") {
	return locale === routing.defaultLocale ? path || "/" : `/${locale}${path}`;
}

export function resolveLocale(candidate: string | null | undefined): Locale {
	return hasLocale(LOCALES, candidate) ? candidate : routing.defaultLocale;
}

export function getLocaleFromPathname(pathname: string) {
	return resolveLocale(pathname.split("/")[1]);
}

export function localeFromAcceptLanguage(header: string | null | undefined): Locale | undefined {
	for (const tag of (header ?? "").split(",")) {
		const language = tag.split(";")[0].trim().split("-")[0].toLowerCase();
		if (hasLocale(LOCALES, language)) return language;
	}

	return undefined;
}

export function routePathFromPathname(pathname: string): string {
	const segments = pathname.split("/").filter(Boolean);
	const withoutLocale = hasLocale(LOCALES, segments[0] ?? "") ? segments.slice(1) : segments;
	return withoutLocale.length ? `/${withoutLocale.join("/")}` : "";
}

export function localeAlternates(path = ""): Record<string, string> {
	return {
		...Object.fromEntries(LOCALES.map((l) => [l, localePath(l, path)])),
		"x-default": localePath(routing.defaultLocale, path),
	};
}

import { describe, expect, it, vi } from "vitest";
import { LOCALES } from "../locales";

vi.mock("../routing", async () => {
	const { EN, LOCALES: L } = await import("../locales");
	return { routing: { defaultLocale: EN, locales: L } };
});

import { getLocaleFromPathname, localeAlternates, localeFromAcceptLanguage, localePath, resolveLocale } from "./url";

describe("localePath", () => {
	it("returns the path as-is for the default locale", () => {
		expect(localePath("en", "/planner")).toBe("/planner");
	});

	it('returns "/" for the default locale with no path argument', () => {
		expect(localePath("en")).toBe("/");
	});

	it('returns "/" for the default locale with an empty path', () => {
		expect(localePath("en", "")).toBe("/");
	});

	it("prefixes non-default locale to the path", () => {
		expect(localePath("es", "/planner")).toBe("/es/planner");
	});

	it('returns "/locale" for a non-default locale with no path argument', () => {
		expect(localePath("ca")).toBe("/ca");
	});

	it('returns "/locale" for a non-default locale with an empty path', () => {
		expect(localePath("fr", "")).toBe("/fr");
	});
});

describe("getLocaleFromPathname", () => {
	it("extracts a known locale from the first path segment", () => {
		expect(getLocaleFromPathname("/es/planner")).toBe("es");
	});

	it("extracts locale from a single-segment pathname", () => {
		expect(getLocaleFromPathname("/ca")).toBe("ca");
	});

	it("extracts locale from a deeply nested pathname", () => {
		expect(getLocaleFromPathname("/fr/legal/privacy-policy")).toBe("fr");
	});

	it("returns the default locale when the first segment is the default locale", () => {
		expect(getLocaleFromPathname("/en/planner")).toBe("en");
	});

	it("falls back to default locale when first segment is not a known locale", () => {
		expect(getLocaleFromPathname("/planner")).toBe("en");
	});

	it("falls back to default locale for the root path", () => {
		expect(getLocaleFromPathname("/")).toBe("en");
	});

	it("falls back to default locale for an unknown first segment", () => {
		expect(getLocaleFromPathname("/xyz/something")).toBe("en");
	});
});

describe("localeAlternates", () => {
	it("contains an entry for every supported locale", () => {
		const alts = localeAlternates("/planner");
		for (const locale of LOCALES) {
			expect(alts).toHaveProperty(locale);
		}
	});

	it("contains x-default", () => {
		expect(localeAlternates("/planner")).toHaveProperty("x-default");
	});

	it("x-default matches the default locale entry", () => {
		const alts = localeAlternates("/planner");
		expect(alts["x-default"]).toBe(alts.en);
	});

	it("default locale entry is the bare path", () => {
		expect(localeAlternates("/planner").en).toBe("/planner");
	});

	it("non-default locale entries are locale-prefixed", () => {
		const alts = localeAlternates("/planner");
		expect(alts.es).toBe("/es/planner");
		expect(alts.ca).toBe("/ca/planner");
		expect(alts.it).toBe("/it/planner");
		expect(alts.fr).toBe("/fr/planner");
		expect(alts.de).toBe("/de/planner");
	});

	it('default locale with no path argument yields "/"', () => {
		const alts = localeAlternates();
		expect(alts.en).toBe("/");
		expect(alts["x-default"]).toBe("/");
	});

	it('non-default locales with no path argument yield "/locale"', () => {
		const alts = localeAlternates();
		expect(alts.es).toBe("/es");
		expect(alts.fr).toBe("/fr");
		expect(alts.de).toBe("/de");
	});
});

describe("resolveLocale", () => {
	it("accepts a supported locale unchanged", () => {
		expect(resolveLocale("es")).toBe("es");
	});

	it.each([["xx"], [""], [null], [undefined], ["EN"], ["es-ES"]])(
		"falls back to the default for %o rather than trusting it",
		(candidate) => {
			expect(resolveLocale(candidate)).toBe("en");
		},
	);
});

describe("localeFromAcceptLanguage", () => {
	it("takes the first supported language, ignoring quality order it cannot honour", () => {
		expect(localeFromAcceptLanguage("da, es;q=0.9, en;q=0.8")).toBe("es");
	});

	it("matches on the primary subtag, so es-419 is Spanish", () => {
		expect(localeFromAcceptLanguage("es-419,es;q=0.9")).toBe("es");
	});

	it("answers undefined when nothing matches, leaving the fallback to the caller", () => {
		expect(localeFromAcceptLanguage("da, ja")).toBeUndefined();
		expect(localeFromAcceptLanguage(null)).toBeUndefined();
	});
});

import caMessages from "@i18n/messages/ca.json";
import deMessages from "@i18n/messages/de.json";
import enMessages from "@i18n/messages/en.json";
import esMessages from "@i18n/messages/es.json";
import frMessages from "@i18n/messages/fr.json";
import itMessages from "@i18n/messages/it.json";
import { EN, LOCALES, type LocaleCode } from "@infrastructure/i18n/locales";
import { createTranslator } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";

const BUNDLES = {
	ca: caMessages,
	de: deMessages,
	en: enMessages,
	es: esMessages,
	fr: frMessages,
	it: itMessages,
} satisfies Record<LocaleCode, typeof enMessages>;

interface TranslationsRequest {
	locale: LocaleCode;
	namespace: "metadata";
}

const mockGetTranslations = vi.hoisted(() => vi.fn());

vi.mock("next-intl/server", () => ({ getTranslations: mockGetTranslations }));

const { notFoundMetadata, notFoundTitle } = await import("./notFoundMetadata");

const segment = (locale: string): Parameters<typeof notFoundMetadata>[0] => ({ params: Promise.resolve({ locale }) });

beforeEach(() => {
	vi.clearAllMocks();
	mockGetTranslations.mockImplementation(async ({ locale, namespace }: TranslationsRequest) =>
		createTranslator({ locale, messages: BUNDLES[locale], namespace }),
	);
});

describe("notFoundTitle", () => {
	it.each(LOCALES.map((locale) => [locale]))("titles the %s 404 in its own language", async (locale) => {
		expect(await notFoundTitle(locale)).toEqual({ title: BUNDLES[locale].metadata.notFound.title });
	});

	it("gives every locale a title of its own, so no bundle copies another's", () => {
		const titles = new Set(LOCALES.map((locale) => BUNDLES[locale].metadata.notFound.title));

		expect(titles.size).toBe(LOCALES.length);
	});
});

describe("notFoundMetadata", () => {
	it("reads the locale off the segment and asks for the metadata namespace in it", async () => {
		expect(await notFoundMetadata(segment("de"))).toEqual({ title: deMessages.metadata.notFound.title });
		expect(mockGetTranslations).toHaveBeenCalledExactlyOnceWith({ locale: "de", namespace: "metadata" });
	});

	it("answers a segment no locale claims in the default language, since a dotted path reaches the catch-all unrouted", async () => {
		expect(await notFoundMetadata(segment("wp-admin"))).toEqual({ title: enMessages.metadata.notFound.title });
		expect(mockGetTranslations).toHaveBeenCalledExactlyOnceWith({ locale: EN, namespace: "metadata" });
	});
});

import caMessages from "@i18n/messages/ca.json";
import deMessages from "@i18n/messages/de.json";
import enMessages from "@i18n/messages/en.json";
import esMessages from "@i18n/messages/es.json";
import frMessages from "@i18n/messages/fr.json";
import itMessages from "@i18n/messages/it.json";
import { render } from "@testing-library/react";
import { createFormatter, createTranslator, type Locale } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGetTranslations = vi.hoisted(() => vi.fn());
const mockGetFormatter = vi.hoisted(() => vi.fn());

vi.mock("next-intl/server", () => ({
	getTranslations: mockGetTranslations,
	getFormatter: mockGetFormatter,
}));

vi.mock("./shared", async (importOriginal) => ({
	...(await importOriginal<typeof import("./shared")>()),
	COUNTRY_COUNT: 150,
}));

import { Stats } from "./Stats";
import { COUNTRY_COUNT } from "./shared";

const BUNDLES: Record<string, typeof enMessages> = {
	en: enMessages,
	es: esMessages,
	ca: caMessages,
	it: itMessages,
	de: deMessages,
	fr: frMessages,
};

interface RenderStatsParams {
	locale: Locale;
	messages: typeof enMessages;
}

const renderStats = async ({ locale, messages }: RenderStatsParams) => {
	mockGetTranslations.mockResolvedValue(createTranslator({ locale, messages, namespace: "homepage" }));
	mockGetFormatter.mockResolvedValue(createFormatter({ locale }));
	const { container } = render(await Stats());
	return container.textContent ?? "";
};

describe("Stats", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("formats the multiplier with the German decimal separator", async () => {
		expect(await renderStats({ locale: "de", messages: deMessages })).toContain("3,4×");
	});

	it("formats the multiplier with the English decimal separator", async () => {
		expect(await renderStats({ locale: "en", messages: enMessages })).toContain("3.4×");
	});

	it("abbreviates the suggestion count the way the locale does, which German does not", async () => {
		expect(await renderStats({ locale: "de", messages: deMessages })).toContain("12.000+");
		expect(await renderStats({ locale: "en", messages: enMessages })).toContain("12K+");
	});

	it.each(Object.entries(BUNDLES))("writes the %s multiplier sign from the message", async (locale, messages) => {
		const text = await renderStats({ locale: locale as Locale, messages });

		expect(text).toMatch(/3[.,]4×/);
		expect(text).not.toMatch(/[<>{}]|homepage\./);
	});
});

describe("Stats Country count", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it.each(Object.entries(BUNDLES))(
		"writes the %s count from the one constant that owns it",
		async (locale, messages) => {
			const text = await renderStats({ locale: locale as Locale, messages });

			expect(text).toContain(
				new Intl.NumberFormat(locale).format(COUNTRY_COUNT) + messages.homepage.stats.countriesLabel,
			);
		},
	);
});

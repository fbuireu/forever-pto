import caMessages from "@i18n/messages/ca.json";
import deMessages from "@i18n/messages/de.json";
import enMessages from "@i18n/messages/en.json";
import esMessages from "@i18n/messages/es.json";
import frMessages from "@i18n/messages/fr.json";
import itMessages from "@i18n/messages/it.json";
import { render, screen } from "@testing-library/react";
import { createTranslator, type Locale } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockGetTranslations, mockGetCountries, MockClient } = vi.hoisted(() => ({
	mockGetTranslations: vi.fn(),
	mockGetCountries: vi.fn(),
	MockClient: vi.fn((props: Record<string, unknown>) => (
		<div data-testid="client" data-props={JSON.stringify(props)} />
	)),
}));

vi.mock("next-intl/server", () => ({ getTranslations: mockGetTranslations }));
vi.mock("@infrastructure/services/countries/getCountries", () => ({ getCountries: mockGetCountries }));
vi.mock("@ui/utils/getCurrentYear", () => ({ getCurrentYear: async () => 2026 }));
vi.mock("../quick-start/InlineQuickStartClient", () => ({
	InlineQuickStartClient: MockClient,
}));

import { InlineQuickStart } from "./InlineQuickStart";

const BUNDLES: Record<Locale, typeof enMessages> = {
	en: enMessages,
	es: esMessages,
	ca: caMessages,
	it: itMessages,
	de: deMessages,
	fr: frMessages,
};

const COUNTRIES = [{ value: "ES", label: "Spain", flag: "es" }];

const renderSection = async (locale: Locale = "en") => {
	mockGetTranslations.mockResolvedValue(createTranslator({ locale, messages: BUNDLES[locale], namespace: "homepage" }));
	return render(await InlineQuickStart({ locale }));
};

beforeEach(() => {
	vi.clearAllMocks();
	mockGetCountries.mockReturnValue(COUNTRIES);
});

describe("InlineQuickStart", () => {
	it("names the section by its heading", async () => {
		await renderSection();

		expect(screen.getByRole("region", { name: enMessages.homepage.inlineQuickStart.title })).toBeDefined();
	});

	it("hands the form the Country list of the page's locale and the year it was rendered in", async () => {
		await renderSection("fr");

		expect(mockGetCountries).toHaveBeenCalledExactlyOnceWith("fr");
		expect(JSON.parse(screen.getByTestId("client").getAttribute("data-props") ?? "")).toStrictEqual({
			countries: COUNTRIES,
			serverYear: 2026,
		});
	});

	it.each(Object.keys(BUNDLES) as Locale[])("writes the %s heading and description", async (locale) => {
		const { container } = await renderSection(locale);
		const copy = BUNDLES[locale].homepage.inlineQuickStart;

		expect(container.textContent).toContain(copy.title);
		expect(container.textContent).toContain(copy.description);
	});
});

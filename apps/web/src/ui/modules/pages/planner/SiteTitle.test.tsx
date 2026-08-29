import esMessages from "@i18n/messages/es.json";
import itMessages from "@i18n/messages/it.json";
import { render } from "@testing-library/react";
import { createTranslator, type Locale } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGetTranslations = vi.hoisted(() => vi.fn());

vi.mock("next-intl/server", () => ({ getTranslations: mockGetTranslations }));
vi.mock("./SiteTitleYear", () => ({ SiteTitleYear: () => <span>2026</span> }));

import { SiteTitle } from "./SiteTitle";

interface RenderTitleParams {
	locale: Locale;
	messages: typeof esMessages;
}

const renderTitle = async ({ locale, messages }: RenderTitleParams) => {
	mockGetTranslations.mockResolvedValue(createTranslator({ locale, messages, namespace: "planner" }));
	const { container } = render(await SiteTitle());
	return container.querySelector("h1")?.textContent ?? "";
};

describe("SiteTitle", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("renders the localised heading in Spanish", async () => {
		expect(await renderTitle({ locale: "es", messages: esMessages })).toContain("Planificador");
	});

	it("renders the localised heading in Italian", async () => {
		const heading = await renderTitle({ locale: "it", messages: itMessages });
		expect(heading).toContain("Pianificatore");
		expect(heading).not.toContain("Planner");
	});
});

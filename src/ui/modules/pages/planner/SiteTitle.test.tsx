import esMessages from "@i18n/messages/es.json";
import itMessages from "@i18n/messages/it.json";
import { render } from "@testing-library/react";
import { createTranslator } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGetTranslations = vi.hoisted(() => vi.fn());

vi.mock("next-intl/server", () => ({ getTranslations: mockGetTranslations }));
vi.mock("./SiteTitleYear", () => ({ SiteTitleYear: () => <span>2026</span> }));

import { SiteTitle } from "./SiteTitle";

const renderTitle = async (locale: string, messages: typeof esMessages) => {
	mockGetTranslations.mockResolvedValue(createTranslator({ locale, messages, namespace: "planner" }));
	const { container } = render(await SiteTitle());
	return container.querySelector("h1")?.textContent ?? "";
};

describe("SiteTitle", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("renders the localised heading in Spanish", async () => {
		expect(await renderTitle("es", esMessages)).toContain("Planificador");
	});

	it("renders the localised heading in Italian", async () => {
		const heading = await renderTitle("it", itMessages);
		expect(heading).toContain("Pianificatore");
		expect(heading).not.toContain("Planner");
	});
});

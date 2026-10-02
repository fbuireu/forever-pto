import ca from "@i18n/messages/ca.json";
import de from "@i18n/messages/de.json";
import en from "@i18n/messages/en.json";
import esMessages from "@i18n/messages/es.json";
import fr from "@i18n/messages/fr.json";
import itMessages from "@i18n/messages/it.json";
import { render } from "@testing-library/react";
import { createTranslator, type Locale } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGetTranslations = vi.hoisted(() => vi.fn());

vi.mock("next-intl/server", () => ({ getTranslations: mockGetTranslations }));
const siteTitleYear = vi.hoisted(() => vi.fn(({ serverYear }: { serverYear: number }) => <span>{serverYear}</span>));
vi.mock("./SiteTitleYear", () => ({ SiteTitleYear: siteTitleYear }));
vi.mock("@ui/utils/getCurrentYear", () => ({ getCurrentYear: vi.fn().mockResolvedValue(2026) }));

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

const BUNDLES: Record<string, typeof esMessages> = { en, es: esMessages, ca, it: itMessages, de, fr };

const taglineBadges = async ({ locale, messages }: RenderTitleParams) => {
	mockGetTranslations.mockResolvedValue(createTranslator({ locale, messages, namespace: "planner" }));
	const { container } = render(await SiteTitle());
	return Array.from(container.querySelectorAll("p > span")).map((badge) => badge.textContent);
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

	it("hands the year island the year the server rendered with, for the first pass to repeat", async () => {
		await renderTitle({ locale: "en", messages: en });

		expect(siteTitleYear.mock.calls.map(([props]) => props)).toStrictEqual([{ serverYear: 2026 }]);
	});

	it("draws both halves of the tagline from one message, each in its own badge", async () => {
		expect(await taglineBadges({ locale: "es", messages: esMessages })).toStrictEqual(["Tu año", "libre"]);
	});

	it.each(Object.entries(BUNDLES))("renders the %s tagline as two filled badges", async (locale, messages) => {
		const badges = await taglineBadges({ locale: locale as Locale, messages });

		expect(badges).toHaveLength(2);
		expect(badges.every((badge) => badge && !/[<>{}]|planner\./.test(badge))).toBe(true);
	});
});

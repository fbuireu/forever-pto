import caMessages from "@i18n/messages/ca.json";
import deMessages from "@i18n/messages/de.json";
import enMessages from "@i18n/messages/en.json";
import esMessages from "@i18n/messages/es.json";
import frMessages from "@i18n/messages/fr.json";
import itMessages from "@i18n/messages/it.json";
import { render, screen } from "@testing-library/react";
import { createTranslator, type Locale } from "next-intl";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGetTranslations = vi.hoisted(() => vi.fn());

vi.mock("next-intl/server", () => ({ getTranslations: mockGetTranslations }));
vi.mock("@ui/modules/core/primitives/Badge", () => ({
	Badge: ({ children }: { children: ReactNode }) => <span data-testid="badge">{children}</span>,
}));

import { HowItWorks } from "./HowItWorks";

const how = enMessages.homepage.how;

const BUNDLES: Record<string, typeof enMessages> = {
	en: enMessages,
	es: esMessages,
	ca: caMessages,
	it: itMessages,
	de: deMessages,
	fr: frMessages,
};

interface RenderHowItWorksParams {
	locale?: Locale;
	messages?: typeof enMessages;
}

const renderHowItWorks = async ({ locale = "en", messages = enMessages }: RenderHowItWorksParams = {}) => {
	mockGetTranslations.mockResolvedValue(createTranslator({ locale, messages, namespace: "homepage" }));
	const { container } = render(await HowItWorks());
	return container;
};

const cardsOf = (container: HTMLElement) =>
	[...(container.querySelector(".md\\:grid-cols-3")?.children ?? [])] as HTMLElement[];

describe("HowItWorks", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("counts the steps in the badge from the cards it renders", async () => {
		const container = await renderHowItWorks();

		expect(cardsOf(container)).toHaveLength(3);
		expect(screen.getByTestId("badge").textContent).toBe(how.badge.replace("{steps}", "3"));
	});

	it("numbers the cards in order, since the copy describes a sequence", async () => {
		const cards = cardsOf(await renderHowItWorks());

		expect(cards.map((card) => card.firstElementChild?.textContent)).toEqual(["1", "2", "3"]);
		expect(cards.map((card) => card.querySelector("h3")?.textContent)).toEqual([
			how.inputDaysTitle,
			how.engineTitle,
			how.exportTitle,
		]);
	});

	it("draws the title from one message, each question emphasised inside its quotes", async () => {
		await renderHowItWorks();
		const heading = screen.getByRole("heading", { level: 2 });

		expect(heading.textContent).toBe("From “what do I do” to “trip is booked” in 60 seconds.");
		expect([...heading.querySelectorAll("em")].map((em) => em.textContent)).toEqual([
			"“what do I do”",
			"“trip is booked”",
		]);
	});

	it.each(Object.entries(BUNDLES))("renders the %s title with both questions emphasised", async (locale, messages) => {
		await renderHowItWorks({ locale: locale as Locale, messages });
		const heading = screen.getByRole("heading", { level: 2 });
		const questions = [...heading.querySelectorAll("em")].map((em) => em.textContent ?? "");

		expect(questions).toHaveLength(2);
		expect(questions.every((question) => /\S/.test(question))).toBe(true);
		expect(heading.textContent).not.toMatch(/[<>{}]|homepage\./);
	});
});

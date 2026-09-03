import enMessages from "@i18n/messages/en.json";
import { render, screen } from "@testing-library/react";
import { createTranslator } from "next-intl";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGetTranslations = vi.hoisted(() => vi.fn());

vi.mock("next-intl/server", () => ({ getTranslations: mockGetTranslations }));
vi.mock("@ui/modules/core/primitives/Badge", () => ({
	Badge: ({ children }: { children: ReactNode }) => <span data-testid="badge">{children}</span>,
}));

import { HowItWorks } from "./HowItWorks";

const how = enMessages.homepage.how;

const renderHowItWorks = async () => {
	mockGetTranslations.mockResolvedValue(
		createTranslator({ locale: "en", messages: enMessages, namespace: "homepage" }),
	);
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

	it("quotes both questions inside the title with typographic quotes", async () => {
		await renderHowItWorks();
		const heading = screen.getByRole("heading", { level: 2 }).textContent ?? "";

		expect(heading).toContain(`“${how.question1}”`);
		expect(heading).toContain(`“${how.question2}”`);
		expect(heading.startsWith(how.titleStart)).toBe(true);
		expect(heading.endsWith(how.titleEnd)).toBe(true);
	});
});

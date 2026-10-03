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
	Badge: ({ children }: { children: ReactNode }) => <span>{children}</span>,
}));

import { Testimonials } from "./Testimonials";

const BUNDLES: Record<string, typeof enMessages> = {
	en: enMessages,
	es: esMessages,
	ca: caMessages,
	it: itMessages,
	de: deMessages,
	fr: frMessages,
};

interface RenderTestimonialsParams {
	locale?: Locale;
	messages?: typeof enMessages;
}

const renderTestimonials = async ({ locale = "en", messages = enMessages }: RenderTestimonialsParams = {}) => {
	mockGetTranslations.mockResolvedValue(createTranslator({ locale, messages, namespace: "homepage" }));
	return render(await Testimonials({ locale }));
};

const cardsOf = (container: HTMLElement) =>
	[...(container.querySelectorAll(".md\\:grid-cols-3")[0]?.children ?? [])] as HTMLElement[];

const avatarClassOf = (card: HTMLElement) => card.querySelector(".rounded-full")?.className ?? "";

beforeEach(() => {
	vi.clearAllMocks();
});

describe("Testimonials", () => {
	it("keys each card's colour to the testimonial rather than to the slot it landed in", async () => {
		const first = cardsOf((await renderTestimonials()).container);
		const second = cardsOf((await renderTestimonials()).container);

		expect(first).toHaveLength(6);
		expect(second.map((card) => card.textContent)).toEqual(first.map((card) => card.textContent));
		expect(second.map(avatarClassOf)).toEqual(first.map(avatarClassOf));
	});

	it("gives every card a distinct avatar colour, so six styles cover six testimonials", async () => {
		const cards = cardsOf((await renderTestimonials()).container);
		const colours = cards.map((card) => avatarClassOf(card).match(/bg-\[var\(--color-brand-[a-z]+\)\]/)?.[0]);

		expect(new Set(colours).size).toBe(cards.length);
	});

	it("draws the title from one message, with the emphasis inside it", async () => {
		await renderTestimonials();
		const heading = screen.getByRole("heading", { level: 2 });

		expect(heading.textContent).toBe("People who already reclaimed weeks of their lives.");
		expect(heading.querySelector("em")?.textContent).toBe("weeks");
	});

	it.each(Object.entries(BUNDLES))("renders the %s title with its emphasis", async (locale, messages) => {
		await renderTestimonials({ locale: locale as Locale, messages });
		const heading = screen.getByRole("heading", { level: 2 });

		expect(heading.querySelector("em")?.textContent).toMatch(/\S/);
		expect(heading.textContent).not.toMatch(/[<>{}]|homepage\./);
	});
});

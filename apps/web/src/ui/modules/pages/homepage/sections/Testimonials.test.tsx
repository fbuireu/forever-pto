import { render } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next-intl/server", () => ({
	getTranslations: vi.fn().mockResolvedValue((key: string) => `t:${key}`),
}));

vi.mock("@ui/modules/core/primitives/Badge", () => ({
	Badge: ({ children }: { children: ReactNode }) => <span>{children}</span>,
}));

import { Testimonials } from "./Testimonials";

const cardsOf = (container: HTMLElement) =>
	[...(container.querySelectorAll(".md\\:grid-cols-3")[0]?.children ?? [])] as HTMLElement[];

const avatarClassOf = (card: HTMLElement) => card.querySelector(".rounded-full")?.className ?? "";

const renderTestimonials = async () => {
	const { container } = render(await Testimonials({ locale: "en" }));
	return cardsOf(container);
};

describe("Testimonials", () => {
	it("keys each card's colour to the testimonial rather than to the slot it landed in", async () => {
		const first = await renderTestimonials();
		const second = await renderTestimonials();

		expect(first).toHaveLength(6);
		expect(second.map((card) => card.textContent)).toEqual(first.map((card) => card.textContent));
		expect(second.map(avatarClassOf)).toEqual(first.map(avatarClassOf));
	});

	it("gives every card a distinct avatar colour, so six styles cover six testimonials", async () => {
		const cards = await renderTestimonials();
		const colours = cards.map((card) => avatarClassOf(card).match(/bg-\[var\(--color-brand-[a-z]+\)\]/)?.[0]);

		expect(new Set(colours).size).toBe(cards.length);
	});
});

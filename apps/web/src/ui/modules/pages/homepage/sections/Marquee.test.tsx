import enMessages from "@i18n/messages/en.json";
import { render } from "@testing-library/react";
import { createTranslator } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGetTranslations = vi.hoisted(() => vi.fn());

vi.mock("next-intl/server", () => ({ getTranslations: mockGetTranslations }));

import { Marquee } from "./Marquee";

const ITEMS = enMessages.homepage.marquee.items.split(" · ");

const renderMarquee = async () => {
	mockGetTranslations.mockResolvedValue(
		createTranslator({ locale: "en", messages: enMessages, namespace: "homepage" }),
	);
	const { container } = render(await Marquee());
	return container;
};

const phrasesOf = (container: HTMLElement) =>
	[...container.querySelectorAll("span.inline-flex")].map((span) => (span.textContent ?? "").replace("★", "").trim());

describe("Marquee", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("hides the ticker from assistive technology, since it only repeats copy the page already carries", async () => {
		const container = await renderMarquee();

		expect(container.firstElementChild?.getAttribute("aria-hidden")).toBe("true");
	});

	it("splits the translated list on its separator rather than on a hardcoded count", async () => {
		const phrases = phrasesOf(await renderMarquee());

		expect(ITEMS.length).toBeGreaterThan(1);
		expect(phrases.slice(0, ITEMS.length)).toEqual(ITEMS);
	});

	it("repeats the run exactly twice so the loop has no visible seam", async () => {
		const phrases = phrasesOf(await renderMarquee());

		expect(phrases).toHaveLength(ITEMS.length * 2);
		expect(phrases.slice(ITEMS.length)).toEqual(phrases.slice(0, ITEMS.length));
	});
});

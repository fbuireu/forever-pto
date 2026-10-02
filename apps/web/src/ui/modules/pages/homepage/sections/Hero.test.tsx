import caMessages from "@i18n/messages/ca.json";
import deMessages from "@i18n/messages/de.json";
import enMessages from "@i18n/messages/en.json";
import esMessages from "@i18n/messages/es.json";
import frMessages from "@i18n/messages/fr.json";
import itMessages from "@i18n/messages/it.json";
import { render, screen } from "@testing-library/react";
import { createFormatter, createTranslator, type Locale } from "next-intl";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGetTranslations = vi.hoisted(() => vi.fn());
const mockGetFormatter = vi.hoisted(() => vi.fn());
const mockGetLocale = vi.hoisted(() => vi.fn());

vi.mock("next-intl/server", () => ({
	getTranslations: mockGetTranslations,
	getFormatter: mockGetFormatter,
	getLocale: mockGetLocale,
}));

vi.mock("@ui/modules/shared/QuickStartTrigger", () => ({
	QuickStartTrigger: ({ children, source }: { children: ReactNode; source: string }) => (
		<button type="button" data-source={source}>
			{children}
		</button>
	),
}));
vi.mock("@ui/modules/core/primitives/Badge", () => ({
	Badge: ({ children }: { children: ReactNode }) => <span>{children}</span>,
}));
vi.mock("@ui/modules/core/primitives/Button", () => ({
	Button: ({ children }: { children: ReactNode }) => <span>{children}</span>,
}));
vi.mock("@ui/modules/core/primitives/FlagIcon", () => ({ FlagIcon: () => null }));

import { Hero } from "./Hero";

const NON_BREAKING_SPACES = /[  ]/g;

interface RenderHeroParams {
	locale: Locale;
	messages: typeof enMessages;
}

const BUNDLES: Record<string, typeof enMessages> = {
	en: enMessages,
	es: esMessages,
	ca: caMessages,
	it: itMessages,
	de: deMessages,
	fr: frMessages,
};

const mountHero = async ({ locale, messages }: RenderHeroParams) => {
	mockGetTranslations.mockResolvedValue(createTranslator({ locale, messages, namespace: "homepage" }));
	mockGetFormatter.mockResolvedValue(createFormatter({ locale }));
	mockGetLocale.mockResolvedValue(locale);
	return render(await Hero());
};

const renderHero = async (params: RenderHeroParams) => {
	const { container } = await mountHero(params);
	return (container.textContent ?? "").replace(NON_BREAKING_SPACES, " ");
};

describe("Hero social proof", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("groups the user count with the German convention", async () => {
		expect(await renderHero({ locale: "de", messages: deMessages })).toContain("12.847");
	});

	it("groups the user count with the English convention", async () => {
		expect(await renderHero({ locale: "en", messages: enMessages })).toContain("12,847");
	});

	it("groups the user count with the French convention", async () => {
		const text = await renderHero({ locale: "fr", messages: frMessages });
		expect(text).toContain("12 847");
		expect(text).not.toContain("12.847");
	});

	it("derives the mockup's efficiency from the showcase plan, with the locale decimal separator", async () => {
		expect(await renderHero({ locale: "en", messages: enMessages })).toContain("efficiency 3.36×");
		expect(await renderHero({ locale: "de", messages: deMessages })).toContain("Effizienz 3,36×");
	});

	it("names the showcase plan's Holiday count", async () => {
		expect(await renderHero({ locale: "en", messages: enMessages })).toContain("12 holidays");
	});

	it("formats the rating with the locale decimal separator", async () => {
		expect(await renderHero({ locale: "fr", messages: frMessages })).toContain("4,9");
		expect(await renderHero({ locale: "en", messages: enMessages })).toContain("4.9");
	});

	it("names the hero as the source of the quick start it opens", async () => {
		mockGetTranslations.mockResolvedValue(
			createTranslator({ locale: "en", messages: enMessages, namespace: "homepage" }),
		);
		mockGetFormatter.mockResolvedValue(createFormatter({ locale: "en" }));
		mockGetLocale.mockResolvedValue("en");
		const { container } = render(await Hero());

		expect(container.querySelector("[data-source]")?.getAttribute("data-source")).toBe("hero");
	});
});

describe("Hero title", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("draws both lines of the title from one message, the highlight where the translation puts it", async () => {
		await mountHero({ locale: "en", messages: enMessages });
		const heading = screen.getByRole("heading", { level: 1 });

		expect(heading.textContent).toBe("Work less.Travel more🌴");
		expect(heading.querySelector("br")).not.toBeNull();
		expect(heading.querySelector("span")?.textContent).toBe("more");
	});

	it.each(Object.entries(BUNDLES))(
		"renders the %s title with its line break and its highlight",
		async (locale, messages) => {
			await mountHero({ locale: locale as Locale, messages });
			const heading = screen.getByRole("heading", { level: 1 });
			const [highlight, palm] = heading.querySelectorAll("span");

			expect(heading.querySelector("br")).not.toBeNull();
			expect(highlight?.textContent).toMatch(/\S/);
			expect(palm?.textContent).toBe("🌴");
			expect(heading.textContent).not.toMatch(/[<>{}]|homepage\./);
		},
	);
});

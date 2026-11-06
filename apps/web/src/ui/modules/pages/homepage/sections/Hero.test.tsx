import caMessages from "@i18n/messages/ca.json";
import deMessages from "@i18n/messages/de.json";
import enMessages from "@i18n/messages/en.json";
import esMessages from "@i18n/messages/es.json";
import frMessages from "@i18n/messages/fr.json";
import itMessages from "@i18n/messages/it.json";
import { type RenderResult, render, screen } from "@testing-library/react";
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

const BUNDLES = {
	en: enMessages,
	es: esMessages,
	ca: caMessages,
	it: itMessages,
	de: deMessages,
	fr: frMessages,
} satisfies Record<Locale, typeof enMessages>;

const serveTranslations = ({ locale, messages }: RenderHeroParams) => {
	mockGetTranslations.mockImplementation(async (namespace: "homepage" | "legend") =>
		createTranslator({ locale, messages, namespace }),
	);
	mockGetFormatter.mockResolvedValue(createFormatter({ locale }));
	mockGetLocale.mockResolvedValue(locale);
};

const mountHero = async (params: RenderHeroParams): Promise<RenderResult> => {
	serveTranslations(params);
	return render(await Hero());
};

const mockupDays = (container: HTMLElement): HTMLElement[] => [
	...container.querySelectorAll<HTMLElement>(".aspect-square"),
];

const bandedDays = (container: HTMLElement): string[] =>
	[...container.querySelectorAll('[data-slot="effective-stretch"]')].map(
		(band) => band.parentElement?.textContent ?? "",
	);

const renderHero = async (params: RenderHeroParams): Promise<string> => {
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
		const { container } = await mountHero({ locale: "en", messages: enMessages });

		expect(container.querySelector("[data-source]")?.getAttribute("data-source")).toBe("hero");
	});
});

describe("Hero calendar mockup", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("numbers every day of the mock month, as the planner calendar does, and draws no icon in place of a number", async () => {
		const { container } = await mountHero({ locale: "en", messages: enMessages });

		expect(mockupDays(container).map((cell) => cell.textContent)).toEqual(
			Array.from({ length: 28 }, (_, index) => String(index + 1)),
		);
	});

	it("lays the Effective Days band under each stretch that holds a PTO Day, and under no other day off", async () => {
		const { container } = await mountHero({ locale: "en", messages: enMessages });

		expect(bandedDays(container)).toEqual(["4", "5", "6", "7", "13", "14", "15", "16", "25", "26", "27", "28"]);
	});

	it("rounds the band where the week row ends, even though the stretch carries on into the next row", async () => {
		const { container } = await mountHero({ locale: "en", messages: enMessages });
		const bandUnder = (day: string) =>
			[...container.querySelectorAll('[data-slot="effective-stretch"]')].find(
				(band) => band.parentElement?.textContent === day,
			);

		expect(bandUnder("14")?.className).toContain("rounded-r-[11px]");
		expect(bandUnder("15")?.className).toContain("rounded-l-[11px]");
		expect(bandUnder("5")?.className).not.toMatch(/rounded-[lr]-/);
	});

	it("lets the band show through a weekend inside a stretch and keeps the weekend fill on one outside it", async () => {
		const { container } = await mountHero({ locale: "en", messages: enMessages });
		const tileOf = (day: string) =>
			mockupDays(container)
				.find((cell) => cell.textContent === day)
				?.querySelector("div");

		expect(tileOf("6")?.className).toContain("bg-transparent");
		expect(tileOf("20")?.className).toContain("bg-day-weekend");
		expect(tileOf("20")?.className).not.toContain("bg-transparent");
	});

	it.each(Object.entries(BUNDLES))(
		"names the band in the %s legend with the planner Legend's own label",
		async (locale, messages) => {
			const text = await renderHero({ locale: locale as Locale, messages });

			expect(text).toContain(messages.legend.effective);
		},
	);
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

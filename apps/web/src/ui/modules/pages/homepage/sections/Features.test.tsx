import { getWeekdayNames } from "@application/shared/utils/dates";
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
const mockGetLocale = vi.hoisted(() => vi.fn());
const mockGetFormatter = vi.hoisted(() => vi.fn());

vi.mock("next-intl/server", () => ({
	getTranslations: mockGetTranslations,
	getLocale: mockGetLocale,
	getFormatter: mockGetFormatter,
}));

vi.mock("@ui/modules/core/primitives/Badge", () => ({
	Badge: ({ children }: { children: ReactNode }) => <span>{children}</span>,
}));

vi.mock("@ui/modules/core/primitives/FlagIcon", () => ({ FlagIcon: () => null }));

vi.mock("./shared", async (importOriginal) => ({
	...(await importOriginal<typeof import("./shared")>()),
	COUNTRY_COUNT: 150,
}));

import { Features } from "./Features";
import { COUNTRY_COUNT, dayCell } from "./shared";

const BUNDLES: Record<string, typeof enMessages> = {
	en: enMessages,
	es: esMessages,
	ca: caMessages,
	it: itMessages,
	de: deMessages,
	fr: frMessages,
};

interface RenderFeaturesParams {
	locale: Locale;
	messages?: typeof enMessages;
}

const renderFeatures = async ({ locale, messages = enMessages }: RenderFeaturesParams) => {
	mockGetTranslations.mockResolvedValue(createTranslator({ locale, messages, namespace: "homepage" }));
	mockGetLocale.mockResolvedValue(locale);
	mockGetFormatter.mockResolvedValue(createFormatter({ locale }));
	return render(await Features());
};

const bridgeCellsOf = async (locale: Locale) => {
	const { container } = await renderFeatures({ locale });
	const grid = container.querySelector(".grid-cols-7");
	if (!grid) throw new Error("bridge day grid not rendered");
	return Array.from(grid.children) as HTMLElement[];
};

describe("Features bridge illustration", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it.each<Locale>(["de", "en", "fr"])("labels the days with the %s narrow weekday names", async (locale) => {
		const cells = await bridgeCellsOf(locale);
		expect(cells.map((cell) => cell.textContent)).toEqual(
			getWeekdayNames({ locale, weekStartsOn: 1, format: "narrow" }),
		);
	});

	it("paints the weekend on the last two cells, not on Monday", async () => {
		const cells = await bridgeCellsOf("en");
		expect(cells[0].className).not.toContain(dayCell.weekend);
		expect(cells[5].className).toContain(dayCell.weekend);
		expect(cells[6].className).toContain(dayCell.weekend);
	});
});

describe("Features title", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("draws the title from one message, with the emphasis inside it", async () => {
		await renderFeatures({ locale: "en" });
		const heading = screen.getByRole("heading", { level: 2 });

		expect(heading.textContent).toBe("Not a calendar. An ally against Mondays.");
		expect(heading.querySelector("em")?.textContent).toBe("ally");
	});

	it.each(Object.entries(BUNDLES))("renders the %s title with its emphasis", async (locale, messages) => {
		await renderFeatures({ locale: locale as Locale, messages });
		const heading = screen.getByRole("heading", { level: 2 });

		expect(heading.querySelector("em")?.textContent).toMatch(/\S/);
		expect(heading.textContent).not.toMatch(/[<>{}]|homepage\./);
	});
});

describe("Features best-efficiency figure", () => {
	const DECIMAL_COMMA: Locale[] = ["es", "ca", "it", "de", "fr"];

	it.each(Object.entries(BUNDLES))(
		"writes the %s figure in the locale's number format, the sign from one message",
		async (locale, messages) => {
			const { container } = await renderFeatures({ locale: locale as Locale, messages });
			const figure = container.querySelector(".text-\\[100px\\]");

			expect(figure?.textContent).toBe(DECIMAL_COMMA.includes(locale as Locale) ? "3,5×" : "3.5×");
			expect(figure?.querySelector(".text-\\[32px\\]")?.textContent).toBe("×");
			expect(figure?.textContent).not.toMatch(/[<>{}]|homepage\./);
		},
	);
});

describe("Features Country count", () => {
	const flagsCardOf = (container: HTMLElement) => {
		const chip = Array.from(container.querySelectorAll("span")).find((node) => node.textContent?.startsWith("+"));
		if (!chip?.parentElement) throw new Error("flag chip not rendered");
		return { chip, flagsShown: chip.parentElement.children.length - 1 };
	};

	it("draws the tag from the one constant that owns the count", async () => {
		await renderFeatures({ locale: "en" });

		expect(screen.getByText(`${COUNTRY_COUNT} countries`)).toBeTruthy();
	});

	it.each(Object.entries(BUNDLES))(
		"derives the figure left after the flags from that constant, signed the way %s signs it",
		async (locale, messages) => {
			const { container } = await renderFeatures({ locale: locale as Locale, messages });
			const { chip, flagsShown } = flagsCardOf(container);

			expect(flagsShown).toBeGreaterThan(0);
			expect(chip.textContent).toBe(
				new Intl.NumberFormat(locale, { signDisplay: "always" }).format(COUNTRY_COUNT - flagsShown),
			);
		},
	);
});

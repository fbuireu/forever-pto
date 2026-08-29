import { getWeekdayNames } from "@application/shared/utils/dates";
import { render } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGetLocale = vi.hoisted(() => vi.fn());

vi.mock("next-intl/server", () => ({
	getTranslations: vi.fn().mockResolvedValue((key: string) => `t:${key}`),
	getLocale: mockGetLocale,
}));

vi.mock("@ui/modules/core/primitives/Badge", () => ({
	Badge: ({ children }: { children: ReactNode }) => <span>{children}</span>,
}));

vi.mock("@ui/modules/core/primitives/FlagIcon", () => ({ FlagIcon: () => null }));

import { Features } from "./Features";
import { dayCell } from "./shared";

const renderFeatures = async (locale: string) => {
	mockGetLocale.mockResolvedValue(locale);
	const { container } = render(await Features());
	const grid = container.querySelector(".grid-cols-7");
	if (!grid) throw new Error("bridge day grid not rendered");
	return Array.from(grid.children) as HTMLElement[];
};

describe("Features bridge illustration", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it.each(["de", "en", "fr"])("labels the days with the %s narrow weekday names", async (locale) => {
		const cells = await renderFeatures(locale);
		expect(cells.map((cell) => cell.textContent)).toEqual(
			getWeekdayNames({ locale, weekStartsOn: 1, format: "narrow" }),
		);
	});

	it("does not leak the Spanish Wednesday initial into other locales", async () => {
		const cells = await renderFeatures("en");
		expect(cells.map((cell) => cell.textContent)).not.toContain("X");
	});

	it("paints the weekend on the last two cells, not on Monday", async () => {
		const cells = await renderFeatures("en");
		expect(cells[0].className).not.toContain(dayCell.weekend);
		expect(cells[5].className).toContain(dayCell.weekend);
		expect(cells[6].className).toContain(dayCell.weekend);
	});
});

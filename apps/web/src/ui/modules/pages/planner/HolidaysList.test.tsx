import { HolidayVariant } from "@application/dto/holiday/types";
import en from "@i18n/messages/en.json";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { holidaysState, readyState } = vi.hoisted(() => ({
	holidaysState: { holidays: [] as { variant: string }[] },
	readyState: { areStoresReady: true },
}));

vi.mock("@application/stores/holidays", () => ({
	useHolidaysStore: (selector: (state: typeof holidaysState) => unknown) => selector(holidaysState),
}));
vi.mock("@application/stores/premium", () => ({ PremiumFeatureId: { CUSTOM_HOLIDAYS: "customHolidays" } }));
vi.mock("@ui/hooks/useStoresReady", () => ({ useStoresReady: () => readyState }));
vi.mock("@ui/modules/premium/PremiumFeature", () => ({
	PremiumFeature: ({ children, feature }: { children: ReactNode; feature: string }) => (
		<div data-testid="premium-gate" data-feature={feature}>
			{children}
		</div>
	),
}));
vi.mock("./holidays/HolidaysTable", () => ({
	HolidaysTable: ({ variant, title, open }: { variant: string; title: string; open: boolean }) => (
		<div data-testid="table" data-variant={variant} data-open={String(open)}>
			{title}
		</div>
	),
}));

const { HolidaysList } = await import("./HolidaysList");

const renderList = () =>
	render(
		<NextIntlClientProvider locale="en" messages={en}>
			<HolidaysList />
		</NextIntlClientProvider>,
	);

const table = () => screen.getByTestId("table");

beforeEach(() => {
	holidaysState.holidays = [{ variant: HolidayVariant.NATIONAL }];
	readyState.areStoresReady = true;
});

describe("HolidaysList", () => {
	it("opens on the national tab, with that table already expanded", () => {
		renderList();

		expect(screen.getByRole("tab", { name: en.holidaysTable.nationalTab }).getAttribute("aria-selected")).toBe("true");
		expect(table().dataset.variant).toBe(HolidayVariant.NATIONAL);
		expect(table().dataset.open).toBe("true");
		expect(table().textContent).toBe(en.holidaysTable.nationalTitle);
	});

	it("keeps the regional tab inert while the region has no holidays, rather than opening an empty table", () => {
		renderList();

		expect(screen.queryByRole("tab", { name: en.holidaysTable.regionalTab })).toBeNull();
		expect(screen.getByText(en.holidaysTable.regionalTab).className).toContain("cursor-not-allowed");
	});

	it("turns the regional tab on once regional holidays exist, and shows their table on click", async () => {
		holidaysState.holidays = [{ variant: HolidayVariant.NATIONAL }, { variant: HolidayVariant.REGIONAL }];
		renderList();

		await userEvent.click(screen.getByRole("tab", { name: en.holidaysTable.regionalTab }));

		expect(await screen.findByText(en.holidaysTable.regionalTitle)).toBeTruthy();
		expect(table().dataset.variant).toBe(HolidayVariant.REGIONAL);
	});

	it("puts the custom tab behind the Premium gate for custom holidays", async () => {
		renderList();

		const gate = screen.getByTestId("premium-gate");
		expect(gate.dataset.feature).toBe("customHolidays");
		expect(gate.querySelector('[role="tab"]')?.textContent).toBe(en.holidaysTable.customTab);

		await userEvent.click(screen.getByRole("tab", { name: en.holidaysTable.customTab }));

		expect(await screen.findByText(en.holidaysTable.customTitle)).toBeTruthy();
	});

	it("renders no table until the stores are ready, and treats regional holidays as absent until then", () => {
		holidaysState.holidays = [{ variant: HolidayVariant.REGIONAL }];
		readyState.areStoresReady = false;
		renderList();

		expect(screen.queryByTestId("table")).toBeNull();
		expect(screen.queryByRole("tab", { name: en.holidaysTable.regionalTab })).toBeNull();
	});
});

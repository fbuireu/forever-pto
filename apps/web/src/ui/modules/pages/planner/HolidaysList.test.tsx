import { HolidayVariant } from "@application/dto/holiday/types";
import en from "@i18n/messages/en.json";
import { fireEvent, type RenderResult, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { holidaysState, readyState, gateState } = vi.hoisted(() => ({
	holidaysState: { holidays: [] as { variant: string }[] },
	readyState: { areStoresReady: true },
	gateState: { isLocked: false, unlock: vi.fn(), calls: [] as unknown[] },
}));

const track = vi.hoisted(() => vi.fn());
vi.mock("@infrastructure/clients/logging/better-stack/tracking", () => ({ track }));

vi.mock("@application/stores/holidays", () => ({
	useHolidaysStore: (selector: (state: typeof holidaysState) => unknown) => selector(holidaysState),
}));
vi.mock("@application/stores/premium", () => ({
	PremiumFeatureId: { CUSTOM_HOLIDAYS: "customHolidays" },
	PremiumOrigin: { PLANNER: "planner" },
}));
vi.mock("@ui/hooks/useStoresReady", () => ({ useStoresReady: () => readyState }));
vi.mock("@ui/hooks/usePremiumGate", () => ({
	usePremiumGate: (gate: unknown) => {
		gateState.calls.push(gate);
		return { isLocked: gateState.isLocked, unlock: gateState.unlock };
	},
}));
vi.mock("./holidays/HolidaysTable", () => ({
	HolidaysTable: ({ variant, title, open }: { variant: string; title: string; open: boolean }) => (
		<div data-testid="table" data-variant={variant} data-open={String(open)}>
			{title}
		</div>
	),
}));

const { HolidaysList } = await import("./HolidaysList");

const renderList = (): RenderResult =>
	render(
		<NextIntlClientProvider locale="en" messages={en}>
			<HolidaysList />
		</NextIntlClientProvider>,
	);

const table = (): HTMLElement => screen.getByTestId("table");

beforeEach(() => {
	holidaysState.holidays = [{ variant: HolidayVariant.NATIONAL }];
	readyState.areStoresReady = true;
	gateState.isLocked = false;
	gateState.unlock.mockClear();
	gateState.calls = [];
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

		expect(screen.getByRole("tab", { name: en.holidaysTable.regionalTab })).toHaveProperty("disabled", true);
	});

	it("puts nothing but tabs in the tab list, so the inert regional one is a disabled tab rather than a bare label", () => {
		renderList();
		const list = screen.getByRole("tablist");
		const labelledOutsideATab = [...list.querySelectorAll("*")].filter(
			(node) =>
				!node.closest('[role="tab"]') &&
				[...node.childNodes].some((child) => child.nodeType === Node.TEXT_NODE && child.textContent?.trim()),
		);

		expect(screen.getAllByRole("tab")).toHaveLength(3);
		expect(labelledOutsideATab).toEqual([]);
	});

	it("turns the regional tab on once regional holidays exist, and shows their table on click", async () => {
		holidaysState.holidays = [{ variant: HolidayVariant.NATIONAL }, { variant: HolidayVariant.REGIONAL }];
		renderList();

		await userEvent.click(screen.getByRole("tab", { name: en.holidaysTable.regionalTab }));

		expect(await screen.findByText(en.holidaysTable.regionalTitle)).toBeTruthy();
		expect(table().dataset.variant).toBe(HolidayVariant.REGIONAL);
	});

	it("gates the custom tab on the Premium feature for custom holidays, asked from the planner", () => {
		renderList();

		expect(gateState.calls).toContainEqual({ feature: "customHolidays", origin: "planner" });
	});

	it("opens the custom table on click once Premium is unlocked", async () => {
		renderList();

		await userEvent.click(screen.getByRole("tab", { name: en.holidaysTable.customTab }));

		expect(await screen.findByText(en.holidaysTable.customTitle)).toBeTruthy();
	});

	it("keeps the locked custom tab a tab of the list, unavailable and described, with the lock as a mark only", () => {
		gateState.isLocked = true;
		renderList();

		const custom = screen.getByRole("tab", { name: en.holidaysTable.customTab });
		const hint = document.getElementById(custom.getAttribute("aria-describedby") ?? "");

		expect(screen.getAllByRole("tab")).toHaveLength(3);
		expect(custom.getAttribute("aria-disabled")).toBe("true");
		expect(hint?.textContent).toBe(
			en.premium.unlockFeature.replace("{feature}", en.holidaysTable.customHolidaysFeature),
		);
		expect(hint?.closest('[role="tablist"]')).toBeNull();
		expect(custom.querySelector("button, [role='button'], [tabindex]")).toBeNull();
		expect(custom.querySelector('[data-slot="premium-lock"]')?.getAttribute("aria-hidden")).toBe("true");
	});

	it("asks for Premium instead of switching panels when the locked custom tab is pressed", async () => {
		gateState.isLocked = true;
		renderList();

		await userEvent.click(screen.getByRole("tab", { name: en.holidaysTable.customTab }));

		expect(gateState.unlock).toHaveBeenCalledOnce();
		expect(table().dataset.variant).toBe(HolidayVariant.NATIONAL);
	});

	it("moves focus onto the locked custom tab from the keyboard without asking for Premium", () => {
		gateState.isLocked = true;
		holidaysState.holidays = [{ variant: HolidayVariant.NATIONAL }, { variant: HolidayVariant.REGIONAL }];
		renderList();
		const national = screen.getByRole("tab", { name: en.holidaysTable.nationalTab });
		national.focus();

		fireEvent.keyDown(national, { key: "End" });

		expect(document.activeElement).toBe(screen.getByRole("tab", { name: en.holidaysTable.customTab }));
		expect(gateState.unlock).not.toHaveBeenCalled();
		expect(table().dataset.variant).toBe(HolidayVariant.NATIONAL);
	});

	it("renders no table until the stores are ready, and treats regional holidays as absent until then", () => {
		holidaysState.holidays = [{ variant: HolidayVariant.REGIONAL }];
		readyState.areStoresReady = false;
		renderList();

		expect(screen.queryByTestId("table")).toBeNull();
		expect(screen.getByRole("tab", { name: en.holidaysTable.regionalTab })).toHaveProperty("disabled", true);
	});
});

describe("HolidaysList analytics", () => {
	it("reports the tab that was opened, and nothing for the inert regional tab", async () => {
		track.mockClear();
		renderList();

		await userEvent.click(screen.getByText(en.holidaysTable.regionalTab));
		expect(track).not.toHaveBeenCalled();

		await userEvent.click(screen.getByRole("tab", { name: en.holidaysTable.customTab }));

		expect(track).toHaveBeenCalledExactlyOnceWith({
			event: "holiday_tab_changed",
			properties: { variant: HolidayVariant.CUSTOM },
		});
	});
});

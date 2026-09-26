import en from "@i18n/messages/en.json";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const FUTURE_YEAR = 2099;

const store = vi.hoisted(() => ({
	preferredMonths: [6, 7] as number[],
	setPreferredMonths: vi.fn(),
	year: 2099,
	carryOverMonths: 0,
	allowPastDays: false,
}));

const track = vi.hoisted(() => vi.fn());
vi.mock("@infrastructure/clients/logging/better-stack/tracking", () => ({ track }));

vi.mock("@application/stores/filters", () => ({
	useFiltersStore: (selector: (state: unknown) => unknown) => selector(store),
}));

const { PreferredMonths } = await import("./PreferredMonths");

const renderMonths = () =>
	render(
		<NextIntlClientProvider locale="en" messages={en}>
			<PreferredMonths />
		</NextIntlClientProvider>,
	);

beforeEach(() => {
	store.preferredMonths = [6, 7];
	store.year = FUTURE_YEAR;
	store.carryOverMonths = 0;
	store.allowPastDays = false;
	store.setPreferredMonths.mockClear();
	track.mockClear();
});

describe("PreferredMonths", () => {
	it("offers the twelve months and marks the preferred ones pressed", () => {
		renderMonths();

		const group = screen.getByRole("group", { name: en.sidebar.preferredMonths.title });
		expect(within(group).getAllByRole("button")).toHaveLength(12);
		expect(screen.getByRole("button", { name: /^July \d{4}$/ }).getAttribute("aria-pressed")).toBe("true");
		expect(screen.getByRole("button", { name: /^March \d{4}$/ }).getAttribute("aria-pressed")).toBe("false");
	});

	it("adds a month that was not preferred and reports the new set in calendar order", () => {
		renderMonths();

		fireEvent.click(screen.getByRole("button", { name: /^June \d{4}$/ }));

		expect(store.setPreferredMonths).toHaveBeenCalledExactlyOnceWith([5, 6, 7]);
		expect(track).toHaveBeenCalledExactlyOnceWith({
			event: "planning_input_changed",
			properties: { input: "preferredMonths", inputValue: "5,6,7" },
		});
	});

	it("drops a month that was preferred", () => {
		renderMonths();

		fireEvent.click(screen.getByRole("button", { name: /^August \d{4}$/ }));

		expect(store.setPreferredMonths).toHaveBeenCalledExactlyOnceWith([6]);
	});

	it("says the block may land anywhere once no month is picked", () => {
		store.preferredMonths = [];
		renderMonths();

		expect(screen.getByText(en.sidebar.preferredMonths.anyMonth)).toBeTruthy();
	});

	describe("in the current year with past days off", () => {
		beforeEach(() => {
			vi.useFakeTimers({ now: new Date(2026, 8, 26), toFake: ["Date"] });
			store.year = 2026;
		});
		afterEach(() => vi.useRealTimers());

		it("refuses the months already past, so a choice there cannot be made", () => {
			renderMonths();

			expect(screen.getByRole("button", { name: /^July \d{4}$/ })).toHaveProperty("disabled", true);
			expect(screen.getByRole("button", { name: /^July \d{4}$/ }).getAttribute("aria-pressed")).toBe("false");
			expect(screen.getByRole("button", { name: /^September \d{4}$/ })).toHaveProperty("disabled", false);
			expect(screen.getByText(en.sidebar.preferredMonths.anyMonth)).toBeDefined();
		});

		it("offers them again once past days are allowed", () => {
			store.allowPastDays = true;
			renderMonths();

			expect(screen.getByRole("button", { name: /^July \d{4}$/ })).toHaveProperty("disabled", false);
			expect(screen.getByRole("button", { name: /^July \d{4}$/ }).getAttribute("aria-pressed")).toBe("true");
		});
	});
});

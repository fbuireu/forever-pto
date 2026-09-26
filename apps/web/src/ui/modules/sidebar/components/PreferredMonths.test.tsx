import en from "@i18n/messages/en.json";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";

const store = vi.hoisted(() => ({ preferredMonths: [6, 7] as number[], setPreferredMonths: vi.fn() }));

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
	store.setPreferredMonths.mockClear();
	track.mockClear();
});

describe("PreferredMonths", () => {
	it("offers the twelve months and marks the preferred ones pressed", () => {
		renderMonths();

		const group = screen.getByRole("group", { name: en.sidebar.preferredMonths.title });
		expect(within(group).getAllByRole("button")).toHaveLength(12);
		expect(screen.getByRole("button", { name: "July" }).getAttribute("aria-pressed")).toBe("true");
		expect(screen.getByRole("button", { name: "March" }).getAttribute("aria-pressed")).toBe("false");
	});

	it("adds a month that was not preferred and reports the new set in calendar order", () => {
		renderMonths();

		fireEvent.click(screen.getByRole("button", { name: "June" }));

		expect(store.setPreferredMonths).toHaveBeenCalledExactlyOnceWith([6, 7, 5]);
		expect(track).toHaveBeenCalledExactlyOnceWith({
			event: "planning_input_changed",
			properties: { input: "preferredMonths", inputValue: "5,6,7" },
		});
	});

	it("drops a month that was preferred", () => {
		renderMonths();

		fireEvent.click(screen.getByRole("button", { name: "August" }));

		expect(store.setPreferredMonths).toHaveBeenCalledExactlyOnceWith([6]);
	});

	it("says the block may land anywhere once no month is picked", () => {
		store.preferredMonths = [];
		renderMonths();

		expect(screen.getByText(en.sidebar.preferredMonths.anyMonth)).toBeTruthy();
	});
});

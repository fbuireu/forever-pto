import en from "@i18n/messages/en.json";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import type { ComponentProps, ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const store = vi.hoisted(() => ({ year: 2026, setYear: vi.fn() }));
const stores = vi.hoisted(() => ({ ready: true }));
vi.mock("@ui/hooks/useStoresReady", () => ({ useStoresReady: () => ({ areStoresReady: stores.ready }) }));

const track = vi.hoisted(() => vi.fn());
const askForPlan = vi.hoisted(() => vi.fn());
vi.mock("@application/stores/holidays", () => ({
	useHolidaysStore: (selector: (state: unknown) => unknown) => selector({ askForPlan }),
}));
vi.mock("@infrastructure/clients/logging/better-stack/tracking", () => ({ track }));

vi.mock("@application/stores/filters", () => ({
	useFiltersStore: (selector: (state: unknown) => unknown) => selector({ year: store.year, setYear: store.setYear }),
}));

vi.mock("@ui/modules/core/animate/base/Popover", () => ({
	Popover: ({ children }: { children?: ReactNode }) => <div data-primitive="popover">{children}</div>,
	PopoverTrigger: ({ children }: { children?: ReactNode }) => <div data-primitive="popover-trigger">{children}</div>,
	PopoverContent: ({ children, ...props }: ComponentProps<"div">) => <div {...props}>{children}</div>,
}));

const { Years } = await import("./Years");

const renderYears = (serverYear = 2026) =>
	render(
		<NextIntlClientProvider locale="en" messages={en}>
			<Years serverYear={serverYear} />
		</NextIntlClientProvider>,
	);

const visitorClockAt = (year: number) => vi.useFakeTimers({ now: new Date(year, 5, 15), toFake: ["Date"] });

const offeredYears = () => screen.getAllByRole("option").map((option) => option.textContent?.trim());

const trigger = () => screen.getByRole("button", { name: en.sidebar.years.title });

beforeEach(() => {
	store.year = 2026;
	store.setYear.mockClear();
	stores.ready = true;
	visitorClockAt(2026);
});

afterEach(() => {
	vi.useRealTimers();
});

describe("Years", () => {
	it("offers ten years around the visitor's year, five behind it and four ahead", () => {
		renderYears(2026);

		expect(offeredYears()).toStrictEqual([
			"2021",
			"2022",
			"2023",
			"2024",
			"2025",
			"2026",
			"2027",
			"2028",
			"2029",
			"2030",
		]);
	});

	it("moves the whole window with the visitor's year rather than pinning a decade", () => {
		visitorClockAt(2030);
		renderYears(2030);

		expect(offeredYears()).toStrictEqual([
			"2025",
			"2026",
			"2027",
			"2028",
			"2029",
			"2030",
			"2031",
			"2032",
			"2033",
			"2034",
		]);
	});

	it("centres the window on the visitor's year once mounted, not on the year the server rendered with", () => {
		visitorClockAt(2031);
		renderYears(2026);

		expect(offeredYears()).toStrictEqual([
			"2026",
			"2027",
			"2028",
			"2029",
			"2030",
			"2031",
			"2032",
			"2033",
			"2034",
			"2035",
		]);
	});

	it("shows the year the server rendered with until the stores are ready, so the first pass matches the HTML", () => {
		stores.ready = false;
		store.year = 2027;

		renderYears(2026);

		expect(trigger().textContent).toContain("2026");
		expect(trigger().textContent).not.toContain("2027");
	});

	it("shows the year the store holds, which need not be the current one", () => {
		store.year = 2024;

		renderYears(2026);

		expect(trigger().textContent).toContain("2024");
	});

	it("stores the year that was picked, as a number rather than the string the list item carries", async () => {
		renderYears(2026);

		await userEvent.click(screen.getByRole("option", { name: "2028" }));

		expect(store.setYear).toHaveBeenCalledExactlyOnceWith(2028);
	});

	it("names the control, so the field label points at something", () => {
		const { container } = renderYears();

		expect(container.querySelector("label")?.getAttribute("for")).toBe("years");
		expect(trigger().id).toBe("years");
	});

	it("reports the list it opens as closed until it is opened", () => {
		renderYears();

		expect(trigger().getAttribute("aria-expanded")).toBe("false");
		expect(trigger().getAttribute("aria-haspopup")).toBe("listbox");
	});
});

describe("Years analytics", () => {
	it("asks for a plan when another year is picked, and none for the year already set", async () => {
		askForPlan.mockClear();
		renderYears(2026);

		await userEvent.click(screen.getByRole("option", { name: "2026" }));
		expect(askForPlan).not.toHaveBeenCalled();

		await userEvent.click(screen.getByRole("option", { name: "2027" }));
		expect(askForPlan).toHaveBeenCalledOnce();
	});

	it("reports the year that was picked", async () => {
		track.mockClear();
		renderYears(2026);

		await userEvent.click(screen.getByRole("option", { name: "2027" }));

		expect(track).toHaveBeenCalledExactlyOnceWith({
			event: "planning_input_changed",
			properties: { input: "year", inputValue: 2027 },
		});
	});
});

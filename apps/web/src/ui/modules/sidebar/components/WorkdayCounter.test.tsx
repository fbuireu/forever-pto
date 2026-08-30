import { type HolidayDTO, HolidayVariant } from "@application/dto/holiday/types";
import en from "@i18n/messages/en.json";
import { fireEvent, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type { ComponentType } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

interface CalendarModalProps {
	open: boolean;
	setOpen: (open: boolean) => void;
	handleRangeSelect: (date: unknown) => void;
}

const holidays = vi.hoisted(() => ({ value: [] as HolidayDTO[] }));

vi.mock("@application/stores/holidays", () => ({
	useHolidaysStore: (selector: (state: unknown) => unknown) => selector({ holidays: holidays.value }),
}));

vi.mock("next/dynamic", () => ({
	default: () => (props: CalendarModalProps) => (
		<div data-testid="calendar-modal" data-open={String(props.open)}>
			<button type="button" onClick={() => props.setOpen(true)}>
				open
			</button>
			<button type="button" onClick={() => props.handleRangeSelect(range.value)}>
				pick
			</button>
			<button type="button" onClick={() => props.handleRangeSelect(undefined)}>
				unpick
			</button>
		</div>
	),
}));

vi.mock("@ui/modules/core/animate/text/SlidingNumber", () => ({
	SlidingNumber: ({ number }: { number: number }) => <span>{number}</span>,
}));

const range = vi.hoisted(() => ({ value: undefined as unknown }));

const { WorkdayCounter } = (await import("./WorkdayCounter")) as { WorkdayCounter: ComponentType };

const day = (isoDate: string) => new Date(`${isoDate}T00:00:00`);

const holiday = (isoDate: string): HolidayDTO => ({
	id: isoDate,
	date: day(isoDate),
	name: "Holiday",
	variant: HolidayVariant.NATIONAL,
	isInPlanningWindow: true,
});

const renderCounter = () =>
	render(
		<NextIntlClientProvider locale="en" messages={en}>
			<WorkdayCounter />
		</NextIntlClientProvider>,
	);

const pick = (from: string, to: string) => {
	range.value = { from: day(from), to: day(to) };
	fireEvent.click(screen.getByRole("button", { name: "pick" }));
};

const unknownYearsWarning = /Holidays are only known for/;

const readout = () => document.body.textContent ?? "";

beforeEach(() => {
	holidays.value = [];
	range.value = undefined;
});

describe("WorkdayCounter", () => {
	it("shows no counts at all until a range is picked", () => {
		renderCounter();

		expect(screen.queryByText(en.workdayCounter.workdays)).toBeNull();
		expect(screen.queryByRole("button", { name: en.workdayCounter.clearSelection })).toBeNull();
	});

	it("counts the weekdays, the whole span and the weekend days of the range", () => {
		renderCounter();

		pick("2026-06-01", "2026-06-07");

		expect(readout()).toContain("5");
		expect(readout()).toContain("7");
		expect(readout()).toContain("2");
	});

	it("does not count a Holiday as a workday, and counts it separately", () => {
		holidays.value = [holiday("2026-06-03")];
		renderCounter();

		pick("2026-06-01", "2026-06-07");

		expect(screen.getByText(en.workdayCounter.holidays)).toBeTruthy();
		expect(readout()).toContain("4");
	});

	it("counts a single day as one day", () => {
		renderCounter();

		pick("2026-06-01", "2026-06-01");

		expect(readout()).toContain("1");
	});

	it("keeps counting nothing while only one end has been picked", () => {
		renderCounter();
		fireEvent.click(screen.getByRole("button", { name: "open" }));

		range.value = { from: day("2026-06-01"), to: undefined };
		fireEvent.click(screen.getByRole("button", { name: "pick" }));

		expect(screen.getByTestId("calendar-modal").dataset.open).toBe("true");
		expect(screen.queryByText(en.workdayCounter.workdays)).toBeNull();
	});

	it("ignores a single date, which is what the other selection modes hand it", () => {
		renderCounter();

		range.value = day("2026-06-01");
		fireEvent.click(screen.getByRole("button", { name: "pick" }));

		expect(screen.queryByText(en.workdayCounter.workdays)).toBeNull();
	});

	it("keeps the range it already counted when a half-picked one arrives after it", () => {
		renderCounter();
		pick("2026-06-01", "2026-06-07");

		range.value = { from: day("2026-07-01"), to: undefined };
		fireEvent.click(screen.getByRole("button", { name: "pick" }));

		expect(readout()).toContain("June 1, 2026");
	});

	it("closes the calendar once both ends are picked", () => {
		renderCounter();
		fireEvent.click(screen.getByRole("button", { name: "open" }));
		expect(screen.getByTestId("calendar-modal").dataset.open).toBe("true");

		pick("2026-06-01", "2026-06-07");

		expect(screen.getByTestId("calendar-modal").dataset.open).toBe("false");
	});

	it("names the range it counted, so the numbers are attributable", () => {
		renderCounter();

		pick("2026-06-01", "2026-06-07");

		expect(readout()).toContain(en.workdayCounter.dateRange);
		expect(readout()).toContain("June 1, 2026");
		expect(readout()).toContain("June 7, 2026");
	});

	it("clears the counts when the reader clears the selection", () => {
		renderCounter();
		pick("2026-06-01", "2026-06-07");

		fireEvent.click(screen.getByRole("button", { name: en.workdayCounter.clearSelection }));

		expect(screen.queryByText(en.workdayCounter.workdays)).toBeNull();
	});

	it("clears the counts when the calendar hands back nothing", () => {
		renderCounter();
		pick("2026-06-01", "2026-06-07");

		fireEvent.click(screen.getByRole("button", { name: "unpick" }));

		expect(screen.queryByText(en.workdayCounter.workdays)).toBeNull();
	});

	it("says so rather than counting silently when the range reaches past the Holidays it knows", () => {
		holidays.value = [holiday("2026-06-03")];
		renderCounter();

		pick("2027-06-01", "2027-06-07");

		expect(screen.getByText(unknownYearsWarning)).toBeTruthy();
	});

	it("warns about a range that starts before the Holidays it knows, not only one that ends after", () => {
		holidays.value = [holiday("2026-06-03")];
		renderCounter();

		pick("2025-06-01", "2026-06-07");

		expect(screen.getByText(unknownYearsWarning)).toBeTruthy();
	});

	it("says nothing about unknown years for a range the Holidays cover", () => {
		holidays.value = [holiday("2026-06-03")];
		renderCounter();

		pick("2026-06-01", "2026-06-07");

		expect(screen.queryByText(unknownYearsWarning)).toBeNull();
	});

	it("says nothing about unknown years when it knows of no Holidays at all", () => {
		renderCounter();

		pick("2027-06-01", "2027-06-07");

		expect(screen.queryByText(unknownYearsWarning)).toBeNull();
	});
});

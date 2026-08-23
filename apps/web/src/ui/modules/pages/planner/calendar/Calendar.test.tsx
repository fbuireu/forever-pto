import { type HolidayDTO, HolidayVariant } from "@application/dto/holiday/types";
import en from "@i18n/messages/en.json";
import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it } from "vitest";
import { Calendar, CalendarSelectionMode } from "./Calendar";
import { MODIFIERS_CLASS_NAMES } from "./utils/helpers";

const MONTH = new Date(2026, 5, 1);

const HOLIDAY: HolidayDTO = {
	id: "es-2026-06-24",
	date: new Date(2026, 5, 24),
	name: "Sant Joan",
	variant: HolidayVariant.REGIONAL,
	isInSelectedRange: true,
};

const renderCalendar = (props: Partial<Parameters<typeof Calendar>[0]> = {}) =>
	render(
		<NextIntlClientProvider locale="en" messages={en}>
			<Calendar
				mode={CalendarSelectionMode.NONE}
				month={MONTH}
				locale="en"
				holidays={[HOLIDAY]}
				allowPastDays
				showOutsideDays
				{...props}
			/>
		</NextIntlClientProvider>,
	);

describe("Calendar day cells", () => {
	it("claims none of the grid roles, because it implements none of the grid keyboard model", () => {
		const { container } = renderCalendar();

		const gridRoles = '[role="grid"], [role="row"], [role="gridcell"], [role="columnheader"]';

		expect(container.querySelectorAll(gridRoles)).toHaveLength(0);
	});

	it("gives every day a full date as its own accessible name, which is what stands in for a grid", () => {
		renderCalendar();

		expect(screen.getByRole("button", { name: "Monday, June 1, 2026" })).toBeTruthy();
		expect(screen.getByRole("button", { name: "Tuesday, June 30, 2026" })).toBeTruthy();
	});

	it("wraps the days in nothing a screen reader announces, since each name already carries the month", () => {
		const { container } = renderCalendar();

		const dayContainer = screen.getByRole("button", { name: "Monday, June 1, 2026" }).closest("div.grid");

		expect(dayContainer?.getAttribute("role")).toBeNull();
		expect(dayContainer?.getAttribute("aria-label")).toBeNull();
		expect(container.querySelectorAll("[aria-label]:not(button)")).toHaveLength(0);
	});

	it("folds the Holiday name into the day's name rather than leaving it to the tooltip alone", () => {
		renderCalendar();

		expect(screen.getByRole("button", { name: "Wednesday, June 24, 2026, Sant Joan" })).toBeTruthy();
	});
});

describe("Calendar header", () => {
	const headerOf = (container: HTMLElement) => ({
		title: container.querySelector("h3")?.textContent,
		freeDays: container.querySelector("span.tabular-nums"),
	});

	it("renders the same title and Free Day count whether or not it carries navigation", () => {
		const plain = headerOf(renderCalendar().container);
		const navigating = headerOf(renderCalendar({ showNavigation: true }).container);

		expect(plain.title).toBe("June 2026");
		expect(navigating.title).toBe(plain.title);
		expect(navigating.freeDays?.textContent).toBe(plain.freeDays?.textContent);
		expect(navigating.freeDays?.className).toBe(plain.freeDays?.className);
	});

	it("lets showNavigation decide only whether the month controls render", () => {
		const { queryByRole } = renderCalendar();

		expect(queryByRole("button", { name: en.calendar.previousMonth })).toBeNull();
		expect(queryByRole("button", { name: en.calendar.nextMonth })).toBeNull();

		const withNavigation = renderCalendar({ showNavigation: true });

		expect(withNavigation.getByRole("button", { name: en.calendar.previousMonth })).toBeTruthy();
		expect(withNavigation.getByRole("button", { name: en.calendar.nextMonth })).toBeTruthy();
	});
});

describe("Calendar day states", () => {
	const isTheFifth = (date: Date) => date.getDate() === 5 && date.getMonth() === 5;

	it("paints only what the caller's day states claim, since it knows nothing about a plan", () => {
		renderCalendar({ dayStates: { suggested: isTheFifth } });

		const fifth = screen.getByRole("button", { name: "Friday, June 5, 2026" });
		const sixth = screen.getByRole("button", { name: "Saturday, June 6, 2026" });

		expect(fifth.className).toContain(MODIFIERS_CLASS_NAMES.suggested);
		expect(sixth.className).not.toContain(MODIFIERS_CLASS_NAMES.suggested);
	});

	it("paints no plan state at all for a caller that supplies none, which is what the two modals do", () => {
		const { container } = renderCalendar();
		const markup = container.innerHTML;

		expect(markup).not.toContain(MODIFIERS_CLASS_NAMES.suggested);
		expect(markup).not.toContain(MODIFIERS_CLASS_NAMES.alternative);
		expect(markup).not.toContain(MODIFIERS_CLASS_NAMES.manuallySelected);
	});
});

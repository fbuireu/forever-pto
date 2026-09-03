import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CalendarListFixture } from "./CalendarListFixture";

const MONTHS_IN_YEAR = 12;
const DAYS_IN_WEEK = 7;
const CELLS_IN_GRID = 42;

describe("CalendarListFixture", () => {
	it("blocks out a year of months, one card each", () => {
		const { container } = render(<CalendarListFixture />);

		expect(container.firstElementChild?.children).toHaveLength(MONTHS_IN_YEAR);
	});

	it("gives every card a full six-week grid under a row of weekday slots, matching the real calendar's shape", () => {
		const { container } = render(<CalendarListFixture />);

		for (const card of Array.from(container.firstElementChild?.children ?? [])) {
			expect(card.querySelector(".grid-cols-7.gap-1")?.children).toHaveLength(DAYS_IN_WEEK);
			expect(card.querySelector(".grid-cols-7.gap-2")?.children).toHaveLength(CELLS_IN_GRID);
		}
	});

	it("offers nothing to press or read", () => {
		const { container } = render(<CalendarListFixture />);

		expect(container.querySelectorAll("button, a, input")).toHaveLength(0);
		expect(container.textContent).toBe("");
	});
});

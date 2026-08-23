import type { HolidayDTO } from "@application/dto/holiday/types";
import { HolidayVariant } from "@application/dto/holiday/types";
import { describe, expect, it } from "vitest";
import {
	calculateHolidaysInRange,
	calculateWeekends,
	calculateWorkdays,
	getCalendarDays,
	getMonthNames,
} from "./helpers";

const holiday = (date: Date): HolidayDTO => ({
	id: `h-${date.toDateString()}`,
	date,
	name: "Holiday",
	variant: HolidayVariant.NATIONAL,
	isInSelectedRange: true,
});

describe("getMonthNames", () => {
	it("labels a plain year without a year suffix", () => {
		const names = getMonthNames({ locale: "en", monthCount: 12, startYear: 2025 });
		expect(names).toHaveLength(12);
		expect(names.every((name) => !name.includes("'"))).toBe(true);
	});

	it("suffixes the carry-over months with the year they fall in", () => {
		const names = getMonthNames({ locale: "en", monthCount: 15, startYear: 2025 });
		expect(names[11]).not.toContain("'");
		expect(names[12]).toContain("'26");
		expect(names[14]).toContain("'26");
	});

	it("rolls over to the right month, not past the end of the year", () => {
		const short = getMonthNames({ locale: "en", monthCount: 13, startYear: 2025 });
		const first = getMonthNames({ locale: "en", monthCount: 1, startYear: 2026 });
		expect(short[12]).toBe(`${first[0]} '26`);
	});
});

describe("getCalendarDays", () => {
	it("starts on the requested first day of the week", () => {
		const days = getCalendarDays({ month: new Date(2025, 0, 1), weekStartsOn: 1, fixedWeeks: false });
		expect(days[0]?.getDay()).toBe(1);
	});

	it("pads to six full weeks when fixedWeeks is set", () => {
		const days = getCalendarDays({ month: new Date(2025, 1, 1), weekStartsOn: 1, fixedWeeks: true });
		expect(days).toHaveLength(42);
	});
});

describe("the range counters", () => {
	const range = { from: new Date(2025, 0, 1), to: new Date(2025, 0, 7) };

	it("counts Workdays, excluding weekends and Holidays", () => {
		expect(calculateWorkdays({ range, holidays: [] })).toBe(5);
		expect(calculateWorkdays({ range, holidays: [holiday(new Date(2025, 0, 1))] })).toBe(4);
	});

	it("counts weekend days, not weekends", () => {
		expect(calculateWeekends(range)).toBe(2);
	});

	it("counts only the Holidays that fall on a Workday", () => {
		const onSaturday = holiday(new Date(2025, 0, 4));
		expect(calculateHolidaysInRange({ range, holidays: [onSaturday] })).toBe(0);
		expect(calculateHolidaysInRange({ range, holidays: [holiday(new Date(2025, 0, 2))] })).toBe(1);
	});
});

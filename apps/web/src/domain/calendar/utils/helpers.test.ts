import { HolidayVariant } from "@application/dto/holiday/types";
import { PTO_CONSTANTS } from "@domain/calendar/const";
import { beforeEach, describe, expect, it } from "vitest";
import { clearDateKeyCache, clearHolidayCache } from "./cache";
import { findBridges, getAvailableWorkdays } from "./helpers";

const makeDate = (year: number, month: number, day: number) => new Date(year, month - 1, day);

const makeHoliday = (date: Date) => ({
	id: `h-${date.toISOString()}`,
	date,
	name: "Test Holiday",
	variant: HolidayVariant.NATIONAL,
	isInSelectedRange: true,
});

describe("getAvailableWorkdays", () => {
	beforeEach(() => {
		clearDateKeyCache();
		clearHolidayCache();
	});

	it("excludes all weekend days", () => {
		const workdays = getAvailableWorkdays({ months: [makeDate(2025, 1, 1)], holidays: [], allowPastDays: true });
		for (const day of workdays) {
			expect(day.getDay()).not.toBe(0);
			expect(day.getDay()).not.toBe(6);
		}
	});

	it("returns 23 workdays for January 2025 with no holidays", () => {
		const workdays = getAvailableWorkdays({ months: [makeDate(2025, 1, 1)], holidays: [], allowPastDays: true });
		expect(workdays).toHaveLength(23);
	});

	it("excludes holiday workdays", () => {
		const workdays = getAvailableWorkdays({
			months: [makeDate(2025, 1, 1)],
			holidays: [makeHoliday(makeDate(2025, 1, 6))],
			allowPastDays: true,
		});
		expect(workdays).toHaveLength(22);
		expect(workdays.some((w) => w.toDateString() === makeDate(2025, 1, 6).toDateString())).toBe(false);
	});

	it("does not exclude a weekend holiday (weekend already excluded)", () => {
		const workdays = getAvailableWorkdays({
			months: [makeDate(2025, 1, 1)],
			holidays: [makeHoliday(makeDate(2025, 1, 4))],
			allowPastDays: true,
		});
		expect(workdays).toHaveLength(23);
	});

	it("excludes all days when allowPastDays is false and month is fully in the past", () => {
		const workdays = getAvailableWorkdays({ months: [makeDate(2020, 1, 1)], holidays: [], allowPastDays: false });
		expect(workdays).toHaveLength(0);
	});

	it("includes past days when allowPastDays is true", () => {
		const workdays = getAvailableWorkdays({ months: [makeDate(2020, 1, 1)], holidays: [], allowPastDays: true });
		expect(workdays.length).toBeGreaterThan(0);
	});

	it("excludes a Removed Day from the Workday list", () => {
		const removedMonday = makeDate(2025, 1, 6);
		const workdays = getAvailableWorkdays({
			months: [makeDate(2025, 1, 1)],
			holidays: [],
			allowPastDays: true,
			removedDays: [removedMonday],
		});
		expect(workdays).toHaveLength(22);
		expect(workdays.some((w) => w.toDateString() === removedMonday.toDateString())).toBe(false);
	});

	it("does not turn a Removed Day into a free day for the bridges around it", () => {
		const removedMonday = makeDate(2025, 1, 6);
		const workdays = getAvailableWorkdays({
			months: [makeDate(2025, 1, 1)],
			holidays: [],
			allowPastDays: true,
			removedDays: [removedMonday],
		});
		const bridges = findBridges({ availableWorkdays: workdays, holidays: [] });
		const singleDayBridgeOn = (date: Date) =>
			bridges.find((b) => b.ptoDaysNeeded === 1 && b.ptoDays[0].toDateString() === date.toDateString());

		const fridayBefore = singleDayBridgeOn(makeDate(2025, 1, 3));
		expect(fridayBefore?.effectiveDays).toBe(3);

		const tuesdayAfter = singleDayBridgeOn(makeDate(2025, 1, 7));
		expect(tuesdayAfter).toBeUndefined();
	});

	it("combines workdays across multiple months", () => {
		const jan = getAvailableWorkdays({ months: [makeDate(2025, 1, 1)], holidays: [], allowPastDays: true });
		const feb = getAvailableWorkdays({ months: [makeDate(2025, 2, 1)], holidays: [], allowPastDays: true });
		const both = getAvailableWorkdays({
			months: [makeDate(2025, 1, 1), makeDate(2025, 2, 1)],
			holidays: [],
			allowPastDays: true,
		});
		expect(both).toHaveLength(jan.length + feb.length);
	});
});

describe("findBridges", () => {
	beforeEach(() => {
		clearDateKeyCache();
		clearHolidayCache();
	});

	it("returns an empty array when there are no workdays", () => {
		expect(findBridges({ availableWorkdays: [], holidays: [] })).toEqual([]);
	});

	it("returns a bridge for a Monday (adjacent to the preceding weekend)", () => {
		const bridges = findBridges({ availableWorkdays: [makeDate(2025, 1, 6)], holidays: [] });
		const bridge = bridges.find((b) => b.ptoDays[0].toDateString() === makeDate(2025, 1, 6).toDateString());
		expect(bridge).toBeDefined();
		expect(bridge?.ptoDaysNeeded).toBe(1);
		expect(bridge?.effectiveDays).toBe(3);
		expect(bridge?.efficiency).toBe(3);
	});

	it("returns a bridge for a Friday (adjacent to the following weekend)", () => {
		const bridges = findBridges({ availableWorkdays: [makeDate(2025, 1, 10)], holidays: [] });
		expect(bridges).toHaveLength(1);
		expect(bridges[0].effectiveDays).toBe(3);
		expect(bridges[0].efficiency).toBe(3);
	});

	it("does not create a bridge for an isolated mid-week workday", () => {
		const bridges = findBridges({ availableWorkdays: [makeDate(2025, 1, 8)], holidays: [] });
		expect(bridges).toHaveLength(0);
	});

	it("creates a 2-day bridge when consecutive days bridge a weekend", () => {
		const bridges = findBridges({ availableWorkdays: [makeDate(2025, 1, 9), makeDate(2025, 1, 10)], holidays: [] });
		const multiDay = bridges.find((b) => b.ptoDaysNeeded === 2);
		expect(multiDay).toBeDefined();
		expect(multiDay?.effectiveDays).toBe(4);
		expect(multiDay?.efficiency).toBe(2);
	});

	it("expands the effective range to absorb an adjacent holiday", () => {
		const holiday = makeHoliday(makeDate(2025, 1, 10));
		const bridges = findBridges({ availableWorkdays: [makeDate(2025, 1, 9)], holidays: [holiday] });
		const bridge = bridges.find((b) => b.ptoDays[0].toDateString() === makeDate(2025, 1, 9).toDateString());
		expect(bridge).toBeDefined();
		expect(bridge?.effectiveDays).toBe(4);
	});

	it("deduplicates bridges with identical PTO day sets", () => {
		const workdays = getAvailableWorkdays({ months: [makeDate(2025, 1, 1)], holidays: [], allowPastDays: true });
		const bridges = findBridges({ availableWorkdays: workdays, holidays: [] });
		const keys = bridges.map((b) =>
			b.ptoDays
				.map((p) => p.toDateString())
				.sort()
				.join(","),
		);
		expect(keys.length).toBe(new Set(keys).size);
	});

	it("places higher-efficiency bridges before lower-efficiency ones", () => {
		const workdays = [makeDate(2025, 1, 6), makeDate(2025, 1, 7)];
		const bridges = findBridges({ availableWorkdays: workdays, holidays: [] });
		const singleIdx = bridges.findIndex((b) => b.ptoDaysNeeded === 1);
		const multiIdx = bridges.findIndex((b) => b.ptoDaysNeeded === 2);
		if (singleIdx !== -1 && multiIdx !== -1) {
			expect(singleIdx).toBeLessThan(multiIdx);
		}
	});
});

describe("findBridges efficiency floor", () => {
	beforeEach(() => {
		clearDateKeyCache();
		clearHolidayCache();
	});

	it("rejects three PTO days absorbing one weekend, five effective for an efficiency of 1.67", () => {
		const wednesday = makeDate(2025, 1, 8);
		const thursday = makeDate(2025, 1, 9);
		const friday = makeDate(2025, 1, 10);

		const bridges = findBridges({ availableWorkdays: [wednesday, thursday, friday], holidays: [] });

		expect(bridges.some((bridge) => bridge.ptoDaysNeeded === 3)).toBe(false);
		for (const bridge of bridges) {
			expect(bridge.efficiency).toBeGreaterThanOrEqual(PTO_CONSTANTS.EFFICIENCY.MINIMUM);
		}
	});

	it("keeps the one-day candidate beside the same weekend, which clears the floor", () => {
		const friday = makeDate(2025, 1, 10);

		const bridges = findBridges({ availableWorkdays: [friday], holidays: [] });

		const single = bridges.find((bridge) => bridge.ptoDaysNeeded === 1);
		expect(single).toBeDefined();
		expect(single?.efficiency).toBeGreaterThanOrEqual(PTO_CONSTANTS.EFFICIENCY.MINIMUM);
	});

	it("expands through a shutdown longer than the old thirty-day cap", () => {
		const shutdownStart = makeDate(2025, 8, 4);
		const shutdown = Array.from({ length: 35 }, (_, offset) => {
			const date = new Date(shutdownStart);
			date.setDate(date.getDate() + offset);
			return makeHoliday(date);
		});
		const lastFreeDay = shutdown[shutdown.length - 1]?.date as Date;
		const anchor = makeDate(2025, 8, 1);

		const bridges = findBridges({ availableWorkdays: [anchor], holidays: shutdown });
		const bridge = bridges.find(({ ptoDays }) => ptoDays[0]?.toDateString() === anchor.toDateString());

		expect(bridge).toBeDefined();
		expect(bridge?.startDate.toDateString()).toBe(anchor.toDateString());
		expect(bridge?.endDate.toDateString()).toBe(lastFreeDay.toDateString());
		expect(bridge?.effectiveDays).toBe(38);
	});
});

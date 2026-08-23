import { HolidayVariant } from "@application/dto/holiday/types";
import { PTO_CONSTANTS } from "@domain/calendar/const";
import { beforeEach, describe, expect, it } from "vitest";
import { clearDateKeyCache, clearHolidayCache } from "./cache";
import { findBridges, getAvailableWorkdays } from "./helpers";

interface MakeDateParams {
	year: number;
	month: number;
	day: number;
}

const makeDate = ({ year, month, day }: MakeDateParams) => new Date(year, month - 1, day);

const makeHoliday = (date: Date) => ({
	id: `h-${date.toISOString()}`,
	date,
	name: "Test Holiday",
	variant: HolidayVariant.NATIONAL,
	isInPlanningWindow: true,
});

describe("getAvailableWorkdays", () => {
	beforeEach(() => {
		clearDateKeyCache();
		clearHolidayCache();
	});

	it("excludes all weekend days", () => {
		const workdays = getAvailableWorkdays({
			months: [makeDate({ year: 2025, month: 1, day: 1 })],
			holidays: [],
			allowPastDays: true,
		});
		for (const day of workdays) {
			expect(day.getDay()).not.toBe(0);
			expect(day.getDay()).not.toBe(6);
		}
	});

	it("returns 23 workdays for January 2025 with no holidays", () => {
		const workdays = getAvailableWorkdays({
			months: [makeDate({ year: 2025, month: 1, day: 1 })],
			holidays: [],
			allowPastDays: true,
		});
		expect(workdays).toHaveLength(23);
	});

	it("excludes holiday workdays", () => {
		const workdays = getAvailableWorkdays({
			months: [makeDate({ year: 2025, month: 1, day: 1 })],
			holidays: [makeHoliday(makeDate({ year: 2025, month: 1, day: 6 }))],
			allowPastDays: true,
		});
		expect(workdays).toHaveLength(22);
		expect(workdays.some((w) => w.toDateString() === makeDate({ year: 2025, month: 1, day: 6 }).toDateString())).toBe(
			false,
		);
	});

	it("does not exclude a weekend holiday (weekend already excluded)", () => {
		const workdays = getAvailableWorkdays({
			months: [makeDate({ year: 2025, month: 1, day: 1 })],
			holidays: [makeHoliday(makeDate({ year: 2025, month: 1, day: 4 }))],
			allowPastDays: true,
		});
		expect(workdays).toHaveLength(23);
	});

	it("excludes all days when allowPastDays is false and month is fully in the past", () => {
		const workdays = getAvailableWorkdays({
			months: [makeDate({ year: 2020, month: 1, day: 1 })],
			holidays: [],
			allowPastDays: false,
		});
		expect(workdays).toHaveLength(0);
	});

	it("includes past days when allowPastDays is true", () => {
		const workdays = getAvailableWorkdays({
			months: [makeDate({ year: 2020, month: 1, day: 1 })],
			holidays: [],
			allowPastDays: true,
		});
		expect(workdays.length).toBeGreaterThan(0);
	});

	it("excludes a Removed Day from the Workday list", () => {
		const removedMonday = makeDate({ year: 2025, month: 1, day: 6 });
		const workdays = getAvailableWorkdays({
			months: [makeDate({ year: 2025, month: 1, day: 1 })],
			holidays: [],
			allowPastDays: true,
			removedDays: [removedMonday],
		});
		expect(workdays).toHaveLength(22);
		expect(workdays.some((w) => w.toDateString() === removedMonday.toDateString())).toBe(false);
	});

	it("does not turn a Removed Day into a free day for the bridges around it", () => {
		const removedMonday = makeDate({ year: 2025, month: 1, day: 6 });
		const workdays = getAvailableWorkdays({
			months: [makeDate({ year: 2025, month: 1, day: 1 })],
			holidays: [],
			allowPastDays: true,
			removedDays: [removedMonday],
		});
		const bridges = findBridges({ availableWorkdays: workdays, holidays: [] });
		const singleDayBridgeOn = (date: Date) =>
			bridges.find((b) => b.ptoDaysNeeded === 1 && b.ptoDays[0].toDateString() === date.toDateString());

		const fridayBefore = singleDayBridgeOn(makeDate({ year: 2025, month: 1, day: 3 }));
		expect(fridayBefore?.effectiveDays).toBe(3);

		const tuesdayAfter = singleDayBridgeOn(makeDate({ year: 2025, month: 1, day: 7 }));
		expect(tuesdayAfter).toBeUndefined();
	});

	it("combines workdays across multiple months", () => {
		const jan = getAvailableWorkdays({
			months: [makeDate({ year: 2025, month: 1, day: 1 })],
			holidays: [],
			allowPastDays: true,
		});
		const feb = getAvailableWorkdays({
			months: [makeDate({ year: 2025, month: 2, day: 1 })],
			holidays: [],
			allowPastDays: true,
		});
		const both = getAvailableWorkdays({
			months: [makeDate({ year: 2025, month: 1, day: 1 }), makeDate({ year: 2025, month: 2, day: 1 })],
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
		const bridges = findBridges({ availableWorkdays: [makeDate({ year: 2025, month: 1, day: 6 })], holidays: [] });
		const bridge = bridges.find(
			(b) => b.ptoDays[0].toDateString() === makeDate({ year: 2025, month: 1, day: 6 }).toDateString(),
		);
		expect(bridge).toBeDefined();
		expect(bridge?.ptoDaysNeeded).toBe(1);
		expect(bridge?.effectiveDays).toBe(3);
		expect(bridge?.efficiency).toBe(3);
	});

	it("returns a bridge for a Friday (adjacent to the following weekend)", () => {
		const bridges = findBridges({ availableWorkdays: [makeDate({ year: 2025, month: 1, day: 10 })], holidays: [] });
		expect(bridges).toHaveLength(1);
		expect(bridges[0].effectiveDays).toBe(3);
		expect(bridges[0].efficiency).toBe(3);
	});

	it("does not create a bridge for an isolated mid-week workday", () => {
		const bridges = findBridges({ availableWorkdays: [makeDate({ year: 2025, month: 1, day: 8 })], holidays: [] });
		expect(bridges).toHaveLength(0);
	});

	it("creates a 2-day bridge when consecutive days bridge a weekend", () => {
		const bridges = findBridges({
			availableWorkdays: [makeDate({ year: 2025, month: 1, day: 9 }), makeDate({ year: 2025, month: 1, day: 10 })],
			holidays: [],
		});
		const multiDay = bridges.find((b) => b.ptoDaysNeeded === 2);
		expect(multiDay).toBeDefined();
		expect(multiDay?.effectiveDays).toBe(4);
		expect(multiDay?.efficiency).toBe(2);
	});

	it("expands the effective range to absorb an adjacent holiday", () => {
		const holiday = makeHoliday(makeDate({ year: 2025, month: 1, day: 10 }));
		const bridges = findBridges({
			availableWorkdays: [makeDate({ year: 2025, month: 1, day: 9 })],
			holidays: [holiday],
		});
		const bridge = bridges.find(
			(b) => b.ptoDays[0].toDateString() === makeDate({ year: 2025, month: 1, day: 9 }).toDateString(),
		);
		expect(bridge).toBeDefined();
		expect(bridge?.effectiveDays).toBe(4);
	});

	it("emits each PTO-day set once, so no dedupe pass is needed to keep them distinct", () => {
		const workdays = getAvailableWorkdays({
			months: [makeDate({ year: 2025, month: 1, day: 1 })],
			holidays: [],
			allowPastDays: true,
		});
		const bridges = findBridges({ availableWorkdays: workdays, holidays: [] });
		const keys = bridges.map((b) =>
			b.ptoDays
				.map((p) => p.toDateString())
				.sort()
				.join(","),
		);
		expect(keys.length).toBe(new Set(keys).size);
	});

	it("owes that to MIN_MULTI_DAY_SIZE staying above one, which is what stops the size loop re-emitting the single-day candidate", () => {
		expect(PTO_CONSTANTS.BRIDGE_SEARCH.MIN_MULTI_DAY_SIZE).toBeGreaterThan(1);
	});

	it("places higher-efficiency bridges before lower-efficiency ones, whatever order they were emitted in", () => {
		const monday = makeDate({ year: 2025, month: 1, day: 6 });
		const tuesday = makeDate({ year: 2025, month: 1, day: 7 });
		const friday = makeDate({ year: 2025, month: 1, day: 10 });

		const bridges = findBridges({ availableWorkdays: [monday, tuesday, friday], holidays: [] });

		expect(bridges.map((bridge) => bridge.efficiency)).toEqual([3, 3, 2]);
		expect(bridges.map((bridge) => bridge.ptoDays)).toEqual([[monday], [friday], [monday, tuesday]]);
	});
});

describe("findBridges efficiency floor", () => {
	beforeEach(() => {
		clearDateKeyCache();
		clearHolidayCache();
	});

	it("rejects three PTO days absorbing one weekend, five effective for an efficiency of 1.67", () => {
		const wednesday = makeDate({ year: 2025, month: 1, day: 8 });
		const thursday = makeDate({ year: 2025, month: 1, day: 9 });
		const friday = makeDate({ year: 2025, month: 1, day: 10 });

		const bridges = findBridges({ availableWorkdays: [wednesday, thursday, friday], holidays: [] });

		expect(bridges.some((bridge) => bridge.ptoDaysNeeded === 3)).toBe(false);
		for (const bridge of bridges) {
			expect(bridge.efficiency).toBeGreaterThanOrEqual(PTO_CONSTANTS.EFFICIENCY.MINIMUM);
		}
	});

	it("keeps the one-day candidate beside the same weekend, which clears the floor", () => {
		const friday = makeDate({ year: 2025, month: 1, day: 10 });

		const bridges = findBridges({ availableWorkdays: [friday], holidays: [] });

		const single = bridges.find((bridge) => bridge.ptoDaysNeeded === 1);
		expect(single).toBeDefined();
		expect(single?.efficiency).toBeGreaterThanOrEqual(PTO_CONSTANTS.EFFICIENCY.MINIMUM);
	});

	it("expands through a shutdown longer than the old thirty-day cap", () => {
		const shutdownStart = makeDate({ year: 2025, month: 8, day: 4 });
		const shutdown = Array.from({ length: 35 }, (_, offset) => {
			const date = new Date(shutdownStart);
			date.setDate(date.getDate() + offset);
			return makeHoliday(date);
		});
		const lastFreeDay = shutdown[shutdown.length - 1]?.date as Date;
		const anchor = makeDate({ year: 2025, month: 8, day: 1 });

		const bridges = findBridges({ availableWorkdays: [anchor], holidays: shutdown });
		const bridge = bridges.find(({ ptoDays }) => ptoDays[0]?.toDateString() === anchor.toDateString());

		expect(bridge).toBeDefined();
		expect(bridge?.startDate.toDateString()).toBe(anchor.toDateString());
		expect(bridge?.endDate.toDateString()).toBe(lastFreeDay.toDateString());
		expect(bridge?.effectiveDays).toBe(38);
	});
});

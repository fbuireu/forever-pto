import { HolidayVariant } from "@application/dto/holiday/types";
import { beforeEach, describe, expect, it } from "vitest";
import { clearDateKeyCache, clearHolidayCache, createHolidaySet, getCombinationKey, getKey } from "./cache";

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

describe("getKey", () => {
	beforeEach(() => clearDateKeyCache());

	it("returns YYYY-M-D key with 0-indexed month", () => {
		expect(getKey(makeDate({ year: 2025, month: 1, day: 15 }))).toBe("2025-0-15");
		expect(getKey(makeDate({ year: 2025, month: 12, day: 31 }))).toBe("2025-11-31");
	});

	it("returns the same key for two dates representing the same day", () => {
		expect(getKey(makeDate({ year: 2025, month: 6, day: 1 }))).toBe(getKey(makeDate({ year: 2025, month: 6, day: 1 })));
	});

	it("returns different keys for different days", () => {
		expect(getKey(makeDate({ year: 2025, month: 1, day: 1 }))).not.toBe(
			getKey(makeDate({ year: 2025, month: 1, day: 2 })),
		);
	});

	it("returns the cached result on repeated calls for the same timestamp", () => {
		const date = makeDate({ year: 2025, month: 3, day: 20 });
		expect(getKey(date)).toBe(getKey(date));
	});
});

describe("getCombinationKey", () => {
	beforeEach(() => clearDateKeyCache());

	it("returns the same key regardless of input order", () => {
		const a = [makeDate({ year: 2025, month: 1, day: 1 }), makeDate({ year: 2025, month: 1, day: 5 })];
		const b = [makeDate({ year: 2025, month: 1, day: 5 }), makeDate({ year: 2025, month: 1, day: 1 })];
		expect(getCombinationKey(a)).toBe(getCombinationKey(b));
	});

	it("produces different keys for different day sets", () => {
		expect(getCombinationKey([makeDate({ year: 2025, month: 1, day: 1 })])).not.toBe(
			getCombinationKey([makeDate({ year: 2025, month: 1, day: 2 })]),
		);
	});

	it("returns a comma-separated string of sorted keys", () => {
		const days = [
			makeDate({ year: 2025, month: 1, day: 3 }),
			makeDate({ year: 2025, month: 1, day: 1 }),
			makeDate({ year: 2025, month: 1, day: 2 }),
		];
		const parts = getCombinationKey(days).split(",");
		expect(parts.length).toBe(3);
		expect(parts).toEqual([...parts].sort((a, b) => a.localeCompare(b)));
	});
});

describe("createHolidaySet", () => {
	beforeEach(() => {
		clearDateKeyCache();
		clearHolidayCache();
	});

	it("includes weekday holidays", () => {
		const set = createHolidaySet([makeHoliday(makeDate({ year: 2025, month: 1, day: 6 }))]);
		expect(set.has(getKey(makeDate({ year: 2025, month: 1, day: 6 })))).toBe(true);
	});

	it("excludes Saturday holidays", () => {
		expect(createHolidaySet([makeHoliday(makeDate({ year: 2025, month: 1, day: 4 }))]).size).toBe(0);
	});

	it("excludes Sunday holidays", () => {
		expect(createHolidaySet([makeHoliday(makeDate({ year: 2025, month: 1, day: 5 }))]).size).toBe(0);
	});

	it("returns an empty set for an empty holidays array", () => {
		expect(createHolidaySet([])).toEqual(new Set());
	});

	it("hands the second caller the first caller's Set, which is what makes it free", () => {
		const holiday = makeHoliday(makeDate({ year: 2025, month: 1, day: 6 }));

		expect(createHolidaySet([holiday])).toBe(createHolidaySet([holiday]));
	});

	it("clearHolidayCache invalidates the memo", () => {
		const holiday = makeHoliday(makeDate({ year: 2025, month: 1, day: 6 }));
		const before = createHolidaySet([holiday]);
		clearHolidayCache();

		expect(createHolidaySet([holiday])).not.toBe(before);
	});

	it("ignores a new holidays array while the memo stands", () => {
		const first = createHolidaySet([makeHoliday(makeDate({ year: 2025, month: 1, day: 6 }))]);
		const second = createHolidaySet([makeHoliday(makeDate({ year: 2025, month: 2, day: 3 }))]);
		expect(second).toBe(first);
		expect(second.has(getKey(makeDate({ year: 2025, month: 2, day: 3 })))).toBe(false);
	});

	it("picks up a new holidays array once the memo is cleared", () => {
		createHolidaySet([makeHoliday(makeDate({ year: 2025, month: 1, day: 6 }))]);
		clearHolidayCache();
		const second = createHolidaySet([makeHoliday(makeDate({ year: 2025, month: 2, day: 3 }))]);
		expect(second.has(getKey(makeDate({ year: 2025, month: 2, day: 3 })))).toBe(true);
		expect(second.has(getKey(makeDate({ year: 2025, month: 1, day: 6 })))).toBe(false);
	});
});

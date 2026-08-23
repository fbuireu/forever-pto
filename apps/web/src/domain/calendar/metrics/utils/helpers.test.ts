import { HolidayVariant } from "@application/dto/holiday/types";
import { describe, expect, it } from "vitest";
import {
	calculateLongestVacation,
	calculateLongWeekends,
	calculateMaxWorkStreak,
	calculateQuarterDistribution,
	calculateRestBlocks,
	getFirstLastBreak,
	getLongBlocksPerQuarter,
	getMonthlyDist,
	getTotalEffectiveDays,
	getWorkedDaysPerMonth,
} from "./helpers";
import { freeStreaks } from "./streaks";

const WINDOW = { year: 2025, carryOverMonths: 0 };

const makeDate = (year: number, month: number, day: number) => new Date(year, month - 1, day);

const makeBridge = (startDate: Date, endDate: Date, ptoDays: Date[]) => ({
	startDate,
	endDate,
	ptoDays,
	ptoDaysNeeded: ptoDays.length,
	effectiveDays: Math.round((endDate.getTime() - startDate.getTime()) / 86_400_000) + 1,
	efficiency: 0,
});

const makeHoliday = (date: Date) => ({
	id: `h-${date.toISOString()}`,
	date,
	name: "Test Holiday",
	variant: HolidayVariant.NATIONAL,
	isInSelectedRange: true,
});

describe("getMonthlyDist", () => {
	it("returns 12 zeros for empty input", () => {
		expect(getMonthlyDist([], WINDOW)).toEqual(new Array(12).fill(0));
	});

	it("counts dates into correct month buckets", () => {
		const days = [makeDate(2025, 1, 6), makeDate(2025, 1, 7), makeDate(2025, 3, 1)];
		const dist = getMonthlyDist(days, WINDOW);
		expect(dist[0]).toBe(2);
		expect(dist[1]).toBe(0);
		expect(dist[2]).toBe(1);
	});

	it("uses 0-indexed months", () => {
		const dist = getMonthlyDist([makeDate(2025, 12, 1)], WINDOW);
		expect(dist[11]).toBe(1);
	});
});

describe("getLongBlocksPerQuarter", () => {
	it("returns 4 zeros for empty input", () => {
		expect(getLongBlocksPerQuarter({ streaks: freeStreaks({ placedDays: [], holidays: [] }), window: WINDOW })).toEqual(
			[0, 0, 0, 0],
		);
	});

	it("does not count blocks shorter than 3 consecutive free days", () => {
		const ptoDays = [makeDate(2025, 1, 8), makeDate(2025, 1, 9)];
		expect(
			getLongBlocksPerQuarter({ streaks: freeStreaks({ placedDays: ptoDays, holidays: [] }), window: WINDOW }),
		).toEqual([0, 0, 0, 0]);
	});

	it("counts a block of exactly 3 consecutive free days", () => {
		const ptoDays = [makeDate(2025, 1, 7), makeDate(2025, 1, 8), makeDate(2025, 1, 9)];
		expect(
			getLongBlocksPerQuarter({ streaks: freeStreaks({ placedDays: ptoDays, holidays: [] }), window: WINDOW }),
		).toEqual([1, 0, 0, 0]);
	});

	it("counts the weekend a bridge absorbs, so Fri + Mon is one long block", () => {
		const ptoDays = [makeDate(2025, 1, 3), makeDate(2025, 1, 6)];
		expect(
			getLongBlocksPerQuarter({ streaks: freeStreaks({ placedDays: ptoDays, holidays: [] }), window: WINDOW }),
		).toEqual([1, 0, 0, 0]);
	});

	it("counts a holiday that extends a run to 3 days", () => {
		const ptoDays = [makeDate(2025, 1, 8), makeDate(2025, 1, 9)];
		const withHoliday = getLongBlocksPerQuarter({
			streaks: freeStreaks({ placedDays: ptoDays, holidays: [makeHoliday(makeDate(2025, 1, 10))] }),
			window: WINDOW,
		});
		expect(withHoliday).toEqual([1, 0, 0, 0]);
	});

	it("counts a single block for 4+ consecutive days", () => {
		const ptoDays = [makeDate(2025, 1, 6), makeDate(2025, 1, 7), makeDate(2025, 1, 8), makeDate(2025, 1, 9)];
		expect(
			getLongBlocksPerQuarter({ streaks: freeStreaks({ placedDays: ptoDays, holidays: [] }), window: WINDOW })[0],
		).toBe(1);
	});

	it("counts blocks in separate quarters independently", () => {
		const ptoDays = [
			makeDate(2025, 1, 7),
			makeDate(2025, 1, 8),
			makeDate(2025, 1, 9),
			makeDate(2025, 4, 1),
			makeDate(2025, 4, 2),
			makeDate(2025, 4, 3),
		];
		expect(
			getLongBlocksPerQuarter({ streaks: freeStreaks({ placedDays: ptoDays, holidays: [] }), window: WINDOW }),
		).toEqual([1, 1, 0, 0]);
	});

	it("attributes a block straddling a quarter boundary to the quarter it starts in", () => {
		const ptoDays = [makeDate(2025, 3, 31), makeDate(2025, 4, 1), makeDate(2025, 4, 2)];
		expect(
			getLongBlocksPerQuarter({ streaks: freeStreaks({ placedDays: ptoDays, holidays: [] }), window: WINDOW }),
		).toEqual([1, 0, 0, 0]);
	});

	it("does not count isolated mid-week days as a block", () => {
		const ptoDays = [makeDate(2025, 1, 7), makeDate(2025, 1, 9)];
		expect(
			getLongBlocksPerQuarter({ streaks: freeStreaks({ placedDays: ptoDays, holidays: [] }), window: WINDOW }),
		).toEqual([0, 0, 0, 0]);
	});

	it("does not count a run of Free Days the plan placed nothing in, and agrees with Long Weekends", () => {
		const streaks = freeStreaks({
			placedDays: [makeDate(2025, 6, 10)],
			holidays: [makeHoliday(makeDate(2025, 1, 3))],
		});
		const unpaid = streaks.filter((streak) => !streak.hasPlacedDay && streak.length >= 3);

		expect(unpaid).toHaveLength(1);
		expect(calculateLongWeekends(streaks)).toBe(0);
		expect(getLongBlocksPerQuarter({ streaks, window: WINDOW })).toEqual([0, 0, 0, 0]);
	});
});

describe("getTotalEffectiveDays", () => {
	it("returns days.length when no bridges provided", () => {
		expect(getTotalEffectiveDays([makeDate(2025, 1, 6), makeDate(2025, 1, 7)])).toBe(2);
	});

	it("returns days.length when bridges array is empty", () => {
		expect(getTotalEffectiveDays([makeDate(2025, 1, 6)], [])).toBe(1);
	});

	it("counts the whole span a bridge absorbs", () => {
		const bridges = [makeBridge(makeDate(2025, 1, 4), makeDate(2025, 1, 6), [makeDate(2025, 1, 6)])];
		expect(getTotalEffectiveDays([makeDate(2025, 1, 6)], bridges)).toBe(3);
	});

	it("adds standalone days on top of the spans", () => {
		const bridges = [makeBridge(makeDate(2025, 1, 4), makeDate(2025, 1, 6), [makeDate(2025, 1, 6)])];
		expect(getTotalEffectiveDays([makeDate(2025, 1, 6), makeDate(2025, 1, 9)], bridges)).toBe(4);
	});

	it("ignores a bridge whose PTO days are not all in the selection", () => {
		const bridges = [makeBridge(makeDate(2025, 1, 4), makeDate(2025, 1, 6), [makeDate(2025, 1, 6)])];
		expect(getTotalEffectiveDays([makeDate(2025, 1, 9)], bridges)).toBe(1);
	});

	it("discards a multi-day bridge when only part of its PTO days remain selected", () => {
		const bridges = [
			makeBridge(makeDate(2025, 1, 9), makeDate(2025, 1, 12), [makeDate(2025, 1, 9), makeDate(2025, 1, 10)]),
		];

		expect(getTotalEffectiveDays([makeDate(2025, 1, 9), makeDate(2025, 1, 10)], bridges)).toBe(4);
		expect(getTotalEffectiveDays([makeDate(2025, 1, 9)], bridges)).toBe(1);
	});
});

describe("calculateRestBlocks", () => {
	it("returns 0 for empty input", () => {
		expect(calculateRestBlocks([])).toBe(0);
	});

	it("returns 1 for a single date", () => {
		expect(calculateRestBlocks([makeDate(2025, 1, 6)])).toBe(1);
	});

	it("returns 1 when all dates are within 7 days of each other", () => {
		expect(calculateRestBlocks([makeDate(2025, 1, 6), makeDate(2025, 1, 7), makeDate(2025, 1, 13)])).toBe(1);
	});

	it("returns 2 when two groups are more than 7 days apart", () => {
		expect(calculateRestBlocks([makeDate(2025, 1, 6), makeDate(2025, 1, 20)])).toBe(2);
	});

	it("counts blocks regardless of input order", () => {
		expect(calculateRestBlocks([makeDate(2025, 1, 20), makeDate(2025, 1, 6)])).toBe(2);
	});
});

describe("calculateQuarterDistribution", () => {
	it("returns 4 zeros for empty input", () => {
		expect(calculateQuarterDistribution([], WINDOW)).toEqual([0, 0, 0, 0]);
	});

	it("assigns dates to the correct quarter", () => {
		const dates = [makeDate(2025, 1, 1), makeDate(2025, 4, 1), makeDate(2025, 7, 1), makeDate(2025, 10, 1)];
		expect(calculateQuarterDistribution(dates, WINDOW)).toEqual([1, 1, 1, 1]);
	});

	it("places January-March in Q1 (index 0)", () => {
		expect(calculateQuarterDistribution([makeDate(2025, 3, 31)], WINDOW)[0]).toBe(1);
	});

	it("places October-December in Q4 (index 3)", () => {
		expect(calculateQuarterDistribution([makeDate(2025, 12, 1)], WINDOW)[3]).toBe(1);
	});
});

describe("getFirstLastBreak", () => {
	it("returns null for empty input", () => {
		expect(getFirstLastBreak({ dates: [], locale: "en" })).toBeNull();
	});

	it("returns the same month for a single date", () => {
		const result = getFirstLastBreak({ dates: [makeDate(2025, 1, 6)], locale: "en" });
		expect(result).not.toBeNull();
		expect(result?.first).toBe(result?.last);
	});

	it("returns first and last months when dates span multiple months", () => {
		const result = getFirstLastBreak({ dates: [makeDate(2025, 3, 1), makeDate(2025, 1, 6)], locale: "en" });
		expect(result).not.toBeNull();
		expect(result?.first).toMatch(/January|january/i);
		expect(result?.last).toMatch(/March|march/i);
	});
});

describe("getWorkedDaysPerMonth", () => {
	it("returns a positive number for a normal year", () => {
		const result = getWorkedDaysPerMonth({ ptoDays: [], holidays: [], year: 2025 });
		expect(result).toBeGreaterThan(18);
		expect(result).toBeLessThan(24);
	});

	it("decreases when PTO days are added", () => {
		const baseline = getWorkedDaysPerMonth({ ptoDays: [], holidays: [], year: 2025 });
		const withPto = getWorkedDaysPerMonth({ ptoDays: [makeDate(2025, 1, 6)], holidays: [], year: 2025 });
		expect(withPto).toBeLessThan(baseline);
	});

	it("decreases when holidays are added", () => {
		const baseline = getWorkedDaysPerMonth({ ptoDays: [], holidays: [], year: 2025 });
		const withHoliday = getWorkedDaysPerMonth({
			ptoDays: [],
			holidays: [makeHoliday(makeDate(2025, 1, 6))],
			year: 2025,
		});
		expect(withHoliday).toBeLessThan(baseline);
	});

	it("counts a day that is both a Holiday and a PTO Day once, not twice", () => {
		const shared = makeDate(2025, 1, 6);
		const baseline = getWorkedDaysPerMonth({ ptoDays: [], holidays: [], year: 2025 });
		const holidayOnly = getWorkedDaysPerMonth({ ptoDays: [], holidays: [makeHoliday(shared)], year: 2025 });
		const both = getWorkedDaysPerMonth({ ptoDays: [shared], holidays: [makeHoliday(shared)], year: 2025 });

		expect(both).toBe(holidayOnly);
		expect(both).toBeLessThan(baseline);
	});

	it("counts a Manual Day once even though the pipelines pass it as a pseudo-Holiday and as a spent day", () => {
		const manual = makeDate(2025, 2, 11);
		const real = makeDate(2025, 1, 6);
		const pseudoHoliday = makeHoliday(manual);

		const withDuplicate = getWorkedDaysPerMonth({
			ptoDays: [manual],
			holidays: [makeHoliday(real), pseudoHoliday],
			year: 2025,
		});
		const counted = getWorkedDaysPerMonth({ ptoDays: [], holidays: [makeHoliday(real), pseudoHoliday], year: 2025 });

		expect(withDuplicate).toBe(counted);
	});

	it("ignores holidays that fall outside the measured year", () => {
		const baseline = getWorkedDaysPerMonth({ ptoDays: [], holidays: [], year: 2025 });
		const withNextYearHoliday = getWorkedDaysPerMonth({
			ptoDays: [],
			holidays: [makeHoliday(makeDate(2026, 1, 6))],
			year: 2025,
		});
		expect(withNextYearHoliday).toBe(baseline);
	});

	it("ignores PTO days that fall outside the measured year", () => {
		const baseline = getWorkedDaysPerMonth({ ptoDays: [], holidays: [], year: 2025 });
		const withCarryOverPto = getWorkedDaysPerMonth({ ptoDays: [makeDate(2026, 1, 6)], holidays: [], year: 2025 });
		expect(withCarryOverPto).toBe(baseline);
	});
});

describe("calculateMaxWorkStreak", () => {
	it("returns a positive streak when no PTO or holidays", () => {
		const result = calculateMaxWorkStreak({ ptoDays: [], holidays: [], year: 2025, allowPastDays: true });
		expect(result).toBeGreaterThan(0);
	});

	it("returns 0 when the year is fully in the past and allowPastDays is false", () => {
		const result = calculateMaxWorkStreak({ ptoDays: [], holidays: [], year: 2020, allowPastDays: false });
		expect(result).toBe(0);
	});

	it("reduces max streak when PTO breaks up consecutive workdays", () => {
		const noBreak = calculateMaxWorkStreak({ ptoDays: [], holidays: [], year: 2025, allowPastDays: true });
		const withBreak = calculateMaxWorkStreak({
			ptoDays: [
				makeDate(2025, 1, 6),
				makeDate(2025, 1, 7),
				makeDate(2025, 1, 8),
				makeDate(2025, 1, 9),
				makeDate(2025, 1, 10),
			],
			holidays: [],
			year: 2025,
			allowPastDays: true,
		});
		expect(withBreak).toBeLessThan(noBreak);
	});

	it("scans only the planning year when the whole year is still in the future", () => {
		const futureYear = new Date().getFullYear() + 2;
		const ptoDays = [makeDate(futureYear, 3, 2)];
		const skippingPast = calculateMaxWorkStreak({ ptoDays, holidays: [], year: futureYear, allowPastDays: false });
		const wholeYear = calculateMaxWorkStreak({ ptoDays, holidays: [], year: futureYear, allowPastDays: true });
		expect(skippingPast).toBe(wholeYear);
	});

	it("still skips the elapsed part of the current year", () => {
		const currentYear = new Date().getFullYear();
		const skippingPast = calculateMaxWorkStreak({
			ptoDays: [],
			holidays: [],
			year: currentYear,
			allowPastDays: false,
		});
		const wholeYear = calculateMaxWorkStreak({ ptoDays: [], holidays: [], year: currentYear, allowPastDays: true });
		expect(skippingPast).toBeLessThanOrEqual(wholeYear);
	});
});

describe("calculateLongestVacation", () => {
	it("returns 0 when ptoDays is empty", () => {
		expect(calculateLongestVacation(freeStreaks({ placedDays: [], holidays: [] }))).toBe(0);
	});

	it("includes adjacent weekend days in the streak", () => {
		const result = calculateLongestVacation(freeStreaks({ placedDays: [makeDate(2025, 1, 3)], holidays: [] }));
		expect(result).toBeGreaterThanOrEqual(3);
	});

	it("returns a longer streak when multiple PTO days bridge weekends", () => {
		const ptoDays = [
			makeDate(2025, 1, 6),
			makeDate(2025, 1, 7),
			makeDate(2025, 1, 8),
			makeDate(2025, 1, 9),
			makeDate(2025, 1, 10),
		];
		const result = calculateLongestVacation(freeStreaks({ placedDays: ptoDays, holidays: [] }));
		expect(result).toBeGreaterThanOrEqual(9);
	});

	it("includes holidays in the free-day streak", () => {
		const withHoliday = calculateLongestVacation(
			freeStreaks({ placedDays: [makeDate(2025, 1, 6)], holidays: [makeHoliday(makeDate(2025, 1, 7))] }),
		);
		const withoutHoliday = calculateLongestVacation(freeStreaks({ placedDays: [makeDate(2025, 1, 6)], holidays: [] }));
		expect(withHoliday).toBeGreaterThanOrEqual(withoutHoliday);
	});
});

describe("calculateLongWeekends", () => {
	it("returns 0 when ptoDays is empty", () => {
		expect(calculateLongWeekends(freeStreaks({ placedDays: [], holidays: [] }))).toBe(0);
	});

	it("counts a Friday PTO adjacent to a weekend as a long weekend", () => {
		expect(
			calculateLongWeekends(freeStreaks({ placedDays: [makeDate(2025, 1, 3)], holidays: [] })),
		).toBeGreaterThanOrEqual(1);
	});

	it("counts a Monday PTO adjacent to a weekend as a long weekend", () => {
		expect(
			calculateLongWeekends(freeStreaks({ placedDays: [makeDate(2025, 1, 6)], holidays: [] })),
		).toBeGreaterThanOrEqual(1);
	});

	it("does not count isolated mid-week PTO as a long weekend", () => {
		expect(calculateLongWeekends(freeStreaks({ placedDays: [makeDate(2025, 1, 8)], holidays: [] }))).toBe(0);
	});

	it("counts a holiday adjacent to a weekend as a long weekend", () => {
		const holiday = makeHoliday(makeDate(2025, 1, 6));
		expect(
			calculateLongWeekends(freeStreaks({ placedDays: [makeDate(2025, 1, 6)], holidays: [holiday] })),
		).toBeGreaterThanOrEqual(1);
	});
});

describe("getTotalEffectiveDays overlap", () => {
	it("counts a weekend shared by two bridges once", () => {
		const days = [makeDate(2025, 1, 3), makeDate(2025, 1, 6)];
		const bridges = [
			makeBridge(makeDate(2025, 1, 3), makeDate(2025, 1, 5), [makeDate(2025, 1, 3)]),
			makeBridge(makeDate(2025, 1, 4), makeDate(2025, 1, 6), [makeDate(2025, 1, 6)]),
		];
		expect(getTotalEffectiveDays(days, bridges)).toBe(4);
	});

	it("still adds disjoint bridges in full", () => {
		const days = [makeDate(2025, 1, 3), makeDate(2025, 6, 2)];
		const bridges = [
			makeBridge(makeDate(2025, 1, 3), makeDate(2025, 1, 5), [makeDate(2025, 1, 3)]),
			makeBridge(makeDate(2025, 5, 31), makeDate(2025, 6, 2), [makeDate(2025, 6, 2)]),
		];
		expect(getTotalEffectiveDays(days, bridges)).toBe(6);
	});

	it("never reports fewer effective days than days actually spent", () => {
		const days = [makeDate(2025, 1, 3), makeDate(2025, 1, 6), makeDate(2025, 9, 10)];
		const bridges = [
			makeBridge(makeDate(2025, 1, 3), makeDate(2025, 1, 5), [makeDate(2025, 1, 3)]),
			makeBridge(makeDate(2025, 1, 4), makeDate(2025, 1, 6), [makeDate(2025, 1, 6)]),
		];
		expect(getTotalEffectiveDays(days, bridges)).toBeGreaterThanOrEqual(days.length);
	});
});

describe("the Planning Window shapes the distributions", () => {
	const CARRY_OVER = { year: 2025, carryOverMonths: 2 };

	it("gives the monthly distribution one bucket per month of the window, not per calendar month", () => {
		expect(getMonthlyDist([], CARRY_OVER)).toHaveLength(14);
	});

	it("puts a Carry-over Month in its own bucket instead of folding it into the planning year", () => {
		const carryOverDay = makeDate(2026, 1, 5);
		const dist = getMonthlyDist([makeDate(2025, 1, 5), carryOverDay], CARRY_OVER);

		expect(dist[0]).toBe(1);
		expect(dist[12]).toBe(1);
	});

	it("drops a date outside the window rather than folding it in", () => {
		expect(getMonthlyDist([makeDate(2027, 6, 1)], CARRY_OVER).every((n) => n === 0)).toBe(true);
	});

	it("extends the quarters to cover the window", () => {
		expect(calculateQuarterDistribution([], CARRY_OVER)).toHaveLength(5);
		expect(calculateQuarterDistribution([makeDate(2026, 1, 5)], CARRY_OVER)[4]).toBe(1);
	});

	it("extends the long-block quarters the same way", () => {
		expect(
			getLongBlocksPerQuarter({ streaks: freeStreaks({ placedDays: [], holidays: [] }), window: CARRY_OVER }),
		).toHaveLength(5);
	});
});

describe("calculateLongWeekends counts only what the plan produced", () => {
	it("ignores a stretch that Holidays formed on their own", () => {
		const holidays = [makeHoliday(makeDate(2025, 1, 6))];
		const elsewhere = [makeDate(2025, 6, 10)];

		expect(calculateLongWeekends(freeStreaks({ placedDays: elsewhere, holidays: holidays }))).toBe(0);
	});

	it("counts a stretch a placed day joined to the weekend", () => {
		const ptoDays = [makeDate(2025, 1, 3)];

		expect(calculateLongWeekends(freeStreaks({ placedDays: ptoDays, holidays: [] }))).toBe(1);
	});
});

describe("calculateLongestVacation counts only what the plan produced", () => {
	it("ignores a next-year run the Holidays formed on their own", () => {
		const holidays = [makeHoliday(makeDate(2026, 4, 3)), makeHoliday(makeDate(2026, 4, 6))];
		const elsewhere = [makeDate(2025, 6, 10)];

		expect(calculateLongestVacation(freeStreaks({ placedDays: elsewhere, holidays: holidays }))).toBe(1);
	});

	it("still lets a Holiday extend a stretch the plan started", () => {
		const holidays = [makeHoliday(makeDate(2025, 1, 7))];
		const ptoDays = [makeDate(2025, 1, 6)];

		expect(calculateLongestVacation(freeStreaks({ placedDays: ptoDays, holidays: holidays }))).toBe(4);
	});
});

describe("getLongBlocksPerQuarter anchors on the first day inside the window", () => {
	it("keeps a block that reaches back into the previous December", () => {
		const result = getLongBlocksPerQuarter({
			streaks: freeStreaks({ placedDays: [makeDate(2024, 1, 2)], holidays: [makeHoliday(makeDate(2024, 1, 1))] }),
			window: { year: 2024, carryOverMonths: 0 },
		});

		expect(result).toEqual([1, 0, 0, 0]);
	});
});

describe("getTotalEffectiveDays only counts span days that are still free", () => {
	it("drops a day the span crossed that is now a workday again", () => {
		const days = [makeDate(2025, 1, 3)];
		const bridges = [makeBridge(makeDate(2025, 1, 3), makeDate(2025, 1, 7), [makeDate(2025, 1, 3)])];

		expect(getTotalEffectiveDays(days, bridges)).toBe(3);
	});

	it("counts the span in full while the Holiday inside it still stands", () => {
		const days = [makeDate(2025, 1, 3)];
		const bridges = [makeBridge(makeDate(2025, 1, 3), makeDate(2025, 1, 7), [makeDate(2025, 1, 3)])];
		const holidays = [makeHoliday(makeDate(2025, 1, 6)), makeHoliday(makeDate(2025, 1, 7))];

		expect(getTotalEffectiveDays(days, bridges, holidays)).toBe(5);
	});
});

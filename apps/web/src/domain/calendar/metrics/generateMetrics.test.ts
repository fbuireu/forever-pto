import { HolidayVariant } from "@application/dto/holiday/types";
import { describe, expect, it } from "vitest";
import { FilterStrategy } from "../types";
import { generateMetrics } from "./generateMetrics";

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
	isInSelectedRange: true,
});

const LOCALE = "en" as const;
const YEAR = 2025;

describe("generateMetrics", () => {
	it("returns all-zero metrics when suggestion has no days", () => {
		const result = generateMetrics({
			suggestion: { days: [] },
			locale: LOCALE,
			year: YEAR,
			holidays: [],
			allowPastDays: true,
			manuallySelectedDays: [],
			removedSuggestedDays: [],
		});
		expect(result.longWeekends).toBe(0);
		expect(result.restBlocks).toBe(0);
		expect(result.maxWorkStreak).toBe(0);
		expect(result.firstLastBreak).toBeNull();
		expect(result.averageEfficiency).toBe(0);
		expect(result.bonusDays).toBe(0);
		expect(result.quarterDist).toEqual([0, 0, 0, 0]);
		expect(result.bridgesUsed).toBe(0);
		expect(result.workedDaysPerMonth).toBe(0);
		expect(result.totalEffectiveDays).toBe(0);
		expect(result.monthlyDist).toEqual(new Array(12).fill(0));
		expect(result.longBlocksPerQuarter).toEqual(new Array(4).fill(0));
		expect(result.longestVacation).toBe(0);
	});

	it("returns non-zero metrics for a populated suggestion", () => {
		const result = generateMetrics({
			suggestion: { days: [makeDate({ year: 2025, month: 1, day: 6 })], strategy: FilterStrategy.GROUPED },
			locale: LOCALE,
			year: YEAR,
			holidays: [],
			allowPastDays: true,
			manuallySelectedDays: [],
			removedSuggestedDays: [],
		});
		expect(result.restBlocks).toBe(1);
		expect(result.totalEffectiveDays).toBeGreaterThanOrEqual(1);
		expect(result.averageEfficiency).toBeGreaterThanOrEqual(1);
		expect(result.workedDaysPerMonth).toBeGreaterThan(0);
	});

	it("distributes days into the correct month bucket", () => {
		const result = generateMetrics({
			suggestion: { days: [makeDate({ year: 2025, month: 1, day: 6 }), makeDate({ year: 2025, month: 1, day: 7 })] },
			locale: LOCALE,
			year: YEAR,
			holidays: [],
			allowPastDays: true,
			manuallySelectedDays: [],
			removedSuggestedDays: [],
		});
		expect(result.monthlyDist[0]).toBe(2);
		expect(result.quarterDist[0]).toBe(2);
	});

	it("returns correct firstLastBreak months", () => {
		const result = generateMetrics({
			suggestion: { days: [makeDate({ year: 2025, month: 1, day: 6 }), makeDate({ year: 2025, month: 3, day: 10 })] },
			locale: LOCALE,
			year: YEAR,
			holidays: [],
			allowPastDays: true,
			manuallySelectedDays: [],
			removedSuggestedDays: [],
		});
		expect(result.firstLastBreak).not.toBeNull();
		expect(result.firstLastBreak?.first).toMatch(/January|january/i);
		expect(result.firstLastBreak?.last).toMatch(/March|march/i);
	});

	it("counts bridges used when bridges are provided", () => {
		const bridge = {
			startDate: makeDate({ year: 2025, month: 1, day: 4 }),
			endDate: makeDate({ year: 2025, month: 1, day: 6 }),
			ptoDaysNeeded: 1,
			effectiveDays: 3,
			efficiency: 3,
			ptoDays: [makeDate({ year: 2025, month: 1, day: 6 })],
		};
		const result = generateMetrics({
			suggestion: { days: [makeDate({ year: 2025, month: 1, day: 6 })], bridges: [bridge] },
			locale: LOCALE,
			year: YEAR,
			bridges: [bridge],
			holidays: [],
			allowPastDays: true,
			manuallySelectedDays: [],
			removedSuggestedDays: [],
		});
		expect(result.bridgesUsed).toBe(1);
		expect(result.averageEfficiency).toBe(3);
		expect(result.totalEffectiveDays).toBe(3);
		expect(result.bonusDays).toBe(2);
	});

	it("applies manuallySelectedDays by merging with suggestion days", () => {
		const result = generateMetrics({
			suggestion: { days: [makeDate({ year: 2025, month: 1, day: 6 })] },
			locale: LOCALE,
			year: YEAR,
			holidays: [],
			allowPastDays: true,
			manuallySelectedDays: [makeDate({ year: 2025, month: 1, day: 7 })],
			removedSuggestedDays: [],
		});
		expect(result.monthlyDist[0]).toBe(2);
	});

	it("applies removedSuggestedDays by excluding them", () => {
		const result = generateMetrics({
			suggestion: { days: [makeDate({ year: 2025, month: 1, day: 6 }), makeDate({ year: 2025, month: 1, day: 7 })] },
			locale: LOCALE,
			year: YEAR,
			holidays: [],
			allowPastDays: true,
			removedSuggestedDays: [makeDate({ year: 2025, month: 1, day: 6 })],
			manuallySelectedDays: [],
		});
		expect(result.monthlyDist[0]).toBe(1);
	});

	it("counts the free days a bridge absorbs as one long block", () => {
		const result = generateMetrics({
			suggestion: { days: [makeDate({ year: 2025, month: 1, day: 3 }), makeDate({ year: 2025, month: 1, day: 6 })] },
			locale: LOCALE,
			year: YEAR,
			holidays: [],
			allowPastDays: true,
			manuallySelectedDays: [],
			removedSuggestedDays: [],
		});
		expect(result.longBlocksPerQuarter).toEqual([1, 0, 0, 0]);
	});

	it("passes holidays to the long-block scan", () => {
		const result = generateMetrics({
			suggestion: { days: [makeDate({ year: 2025, month: 1, day: 8 }), makeDate({ year: 2025, month: 1, day: 9 })] },
			locale: LOCALE,
			year: YEAR,
			holidays: [makeHoliday(makeDate({ year: 2025, month: 1, day: 10 }))],
			allowPastDays: true,
			manuallySelectedDays: [],
			removedSuggestedDays: [],
		});
		expect(result.longBlocksPerQuarter).toEqual([1, 0, 0, 0]);
	});

	it("scopes the year-wide metrics to the year passed in, not the year the first day falls in", () => {
		const carryOverDay = makeDate({ year: 2026, month: 1, day: 5 });
		const params = {
			suggestion: { days: [carryOverDay] },
			locale: LOCALE,
			holidays: [],
			allowPastDays: true,
		};
		const planned = generateMetrics({ ...params, year: 2025, manuallySelectedDays: [], removedSuggestedDays: [] });
		const inferred = generateMetrics({ ...params, year: 2026, manuallySelectedDays: [], removedSuggestedDays: [] });

		expect(planned.workedDaysPerMonth).toBe(21.8);
		expect(inferred.workedDaysPerMonth).toBe(21.7);
		expect(planned.maxWorkStreak).toBe(261);
		expect(planned.maxWorkStreak).toBeGreaterThan(inferred.maxWorkStreak);
	});

	it("returns zero metrics when all suggested days are removed", () => {
		const result = generateMetrics({
			suggestion: { days: [makeDate({ year: 2025, month: 1, day: 6 })] },
			locale: LOCALE,
			year: YEAR,
			holidays: [],
			allowPastDays: true,
			removedSuggestedDays: [makeDate({ year: 2025, month: 1, day: 6 })],
			manuallySelectedDays: [],
		});
		expect(result.bonusDays).toBe(0);
		expect(result.totalEffectiveDays).toBe(0);
	});

	it("counts only the Bridges Effective Days kept", () => {
		const kept = makeDate({ year: 2025, month: 1, day: 3 });
		const dropped = [makeDate({ year: 2025, month: 1, day: 9 }), makeDate({ year: 2025, month: 1, day: 10 })];
		const bridges = [
			{
				startDate: kept,
				endDate: makeDate({ year: 2025, month: 1, day: 5 }),
				ptoDaysNeeded: 1,
				ptoDays: [kept],
				effectiveDays: 3,
				efficiency: 3,
			},
			{
				startDate: dropped[0] as Date,
				endDate: makeDate({ year: 2025, month: 1, day: 12 }),
				ptoDaysNeeded: 2,
				ptoDays: dropped,
				effectiveDays: 4,
				efficiency: 2,
			},
		];

		const result = generateMetrics({
			suggestion: { days: [kept, ...dropped] },
			locale: LOCALE,
			year: YEAR,
			bridges,
			holidays: [],
			allowPastDays: true,
			removedSuggestedDays: [dropped[0] as Date],
			manuallySelectedDays: [],
		});

		expect(result.bridgesUsed).toBe(1);
	});
});

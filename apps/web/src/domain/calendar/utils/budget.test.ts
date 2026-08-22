import { describe, expect, it } from "vitest";
import { measureBudget, measureGain } from "./budget";

const JAN = (day: number) => new Date(2025, 0, day);

describe("measureBudget", () => {
	it("reports an untouched plan as spent in full by the days it placed", () => {
		expect(measureBudget({ ptoDays: 5, days: [JAN(6), JAN(7), JAN(8)] })).toEqual({
			suggested: 3,
			manual: 0,
			spent: 3,
			remaining: 2,
		});
	});

	it("returns a Removed Day to the budget", () => {
		expect(measureBudget({ ptoDays: 5, days: [JAN(6), JAN(7), JAN(8)], removedSuggestedDays: [JAN(7)] })).toEqual({
			suggested: 2,
			manual: 0,
			spent: 2,
			remaining: 3,
		});
	});

	it("charges a Manual Day against the budget", () => {
		expect(measureBudget({ ptoDays: 5, days: [JAN(6)], manuallySelectedDays: [JAN(20), JAN(21)] })).toEqual({
			suggested: 1,
			manual: 2,
			spent: 3,
			remaining: 2,
		});
	});

	it("counts the days exactly as the Metrics do, Removed and Manual Days together", () => {
		const measure = measureBudget({
			ptoDays: 10,
			days: [JAN(6), JAN(7), JAN(8)],
			manuallySelectedDays: [JAN(20)],
			removedSuggestedDays: [JAN(7)],
		});

		expect(measure).toEqual({ suggested: 2, manual: 1, spent: 3, remaining: 7 });
	});

	it("reports nothing left rather than a negative allowance when a plan overspends", () => {
		const measure = measureBudget({ ptoDays: 1, days: [JAN(6), JAN(7)], manuallySelectedDays: [JAN(20)] });

		expect(measure.spent).toBe(3);
		expect(measure.remaining).toBe(0);
	});

	it("answers for a plan that placed nothing at all", () => {
		expect(measureBudget({ ptoDays: 4 })).toEqual({ suggested: 0, manual: 0, spent: 0, remaining: 4 });
	});
});

describe("measureGain", () => {
	it("measures against the whole budget, not the days the plan placed", () => {
		expect(measureGain({ totalEffectiveDays: 24, ptoDays: 10 })).toEqual({ overBudget: 14, gain: 140 });
	});

	it("answers zero rather than dividing by an empty budget", () => {
		expect(measureGain({ totalEffectiveDays: 5, ptoDays: 0 })).toEqual({ overBudget: 5, gain: 0 });
	});

	it("goes negative when the plan returns less than the budget it was given", () => {
		expect(measureGain({ totalEffectiveDays: 6, ptoDays: 10 })).toEqual({ overBudget: -4, gain: -40 });
	});

	it("parts company with Efficiency by whatever budget went unspent", () => {
		const ptoDays = 10;
		const placed = 8;
		const totalEffectiveDays = 24;

		const { gain } = measureGain({ totalEffectiveDays, ptoDays });
		const efficiency = totalEffectiveDays / placed;

		expect(gain).toBe(140);
		expect(efficiency).toBe(3);
		expect(gain / 100 + 1).not.toBe(efficiency);
	});
});

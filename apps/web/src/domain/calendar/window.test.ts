import { describe, expect, it } from "vitest";
import { MONTHS_IN_YEAR, planningWindowMonths, windowMonthCount, windowQuarterCount } from "./window";

describe("planningWindowMonths", () => {
	it("starts at January of the chosen year, whatever the Carry-over Months", () => {
		const [first] = planningWindowMonths({ year: 2026, carryOverMonths: 5 });

		expect(first?.getFullYear()).toBe(2026);
		expect(first?.getMonth()).toBe(0);
		expect(first?.getDate()).toBe(1);
	});

	it("spans the year plus its Carry-over Months, and rolls into the next year", () => {
		const months = planningWindowMonths({ year: 2026, carryOverMonths: 3 });

		expect(months).toHaveLength(15);
		expect(months.at(-1)?.getFullYear()).toBe(2027);
		expect(months.at(-1)?.getMonth()).toBe(2);
	});

	it("is twelve months with no carry-over, which is the shortest a Planning Window gets", () => {
		expect(planningWindowMonths({ year: 2026, carryOverMonths: 0 })).toHaveLength(MONTHS_IN_YEAR);
	});

	it("agrees with windowMonthCount, which the Metrics size their arrays from", () => {
		for (const carryOverMonths of [0, 1, 6, 12]) {
			const window = { year: 2026, carryOverMonths };

			expect(planningWindowMonths(window)).toHaveLength(windowMonthCount(window));
		}
	});

	it("rounds the quarter count up, so a partial quarter still gets a bucket", () => {
		expect(windowQuarterCount({ carryOverMonths: 0 })).toBe(4);
		expect(windowQuarterCount({ carryOverMonths: 1 })).toBe(5);
		expect(windowQuarterCount({ carryOverMonths: 3 })).toBe(5);
		expect(windowQuarterCount({ carryOverMonths: 4 })).toBe(6);
	});
});

import { endOfMonth } from "@application/shared/utils/dates";
import { describe, expect, it } from "vitest";
import {
	DEFAULT_PREFERRED_MONTHS,
	inPreferredMonths,
	isPreferredMonths,
	MAX_CARRY_OVER_MONTHS,
	MONTHS_IN_YEAR,
	planningWindowInterval,
	planningWindowMonths,
	reachableMonths,
	reachablePreferredMonths,
	windowMonthCount,
	windowQuarterCount,
} from "./window";

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

describe("planningWindowInterval", () => {
	it("ends where the month array does, at every Carry-over Month count the slider allows", () => {
		for (let carryOverMonths = 0; carryOverMonths <= MAX_CARRY_OVER_MONTHS; carryOverMonths++) {
			const window = { year: 2026, carryOverMonths };
			const lastMonth = planningWindowMonths(window).at(-1) as Date;

			expect(planningWindowInterval(window).end).toEqual(endOfMonth(lastMonth));
		}
	});

	it("starts where the month array does", () => {
		for (let carryOverMonths = 0; carryOverMonths <= MAX_CARRY_OVER_MONTHS; carryOverMonths++) {
			const window = { year: 2026, carryOverMonths };

			expect(planningWindowInterval(window).start).toEqual(planningWindowMonths(window)[0]);
		}
	});
});

describe("MAX_CARRY_OVER_MONTHS", () => {
	it("keeps the widest Planning Window inside the two years of Holiday data the source fetches", () => {
		const year = 2026;

		expect(planningWindowInterval({ year, carryOverMonths: MAX_CARRY_OVER_MONTHS }).end.getFullYear()).toBe(year + 1);
	});

	it("is the largest count that does, so one month more runs off the end of the data", () => {
		const year = 2026;

		expect(
			planningWindowInterval({ year, carryOverMonths: MAX_CARRY_OVER_MONTHS + 1 }).end.getFullYear(),
		).toBeGreaterThan(year + 1);
	});
});

describe("isPreferredMonths", () => {
	it.each([[[]], [[0]], [[6, 7]], [[0, 11]]])("accepts %o", (value) => {
		expect(isPreferredMonths(value)).toBe(true);
	});

	it.each([[[24]], [[-1]], [[6, 6]], [[1.5]], [["6"]], ["6,7"], [null], [undefined], [{}]])(
		"rejects %o, which a hand-edited persisted blob or a stale worker message could carry",
		(value) => {
			expect(isPreferredMonths(value)).toBe(false);
		},
	);

	it("accepts the default it is paired with", () => {
		expect(isPreferredMonths([...DEFAULT_PREFERRED_MONTHS])).toBe(true);
	});
});

describe("inPreferredMonths", () => {
	it("holds when every month is preferred", () => {
		expect(inPreferredMonths({ months: [6, 7, 7], preferredMonths: new Set([6, 7]) })).toBe(true);
	});

	it("fails when one month is not", () => {
		expect(inPreferredMonths({ months: [5, 6], preferredMonths: new Set([6, 7]) })).toBe(false);
	});

	it("reads no preference as every month", () => {
		expect(inPreferredMonths({ months: [0, 11], preferredMonths: new Set() })).toBe(true);
	});
});

describe("reachableMonths", () => {
	const today = new Date(2026, 8, 26);

	it("drops the months already behind today when past days are not allowed, keeping the current one", () => {
		const reachable = reachableMonths({ year: 2026, carryOverMonths: 0, allowPastDays: false, today });

		expect([...reachable]).toStrictEqual([8, 9, 10, 11]);
	});

	it("reaches the Carry-over Months, which are the next year's and still ahead", () => {
		const reachable = reachableMonths({ year: 2026, carryOverMonths: 3, allowPastDays: false, today });

		expect([...reachable]).toStrictEqual([8, 9, 10, 11, 12, 13, 14]);
	});

	it("reaches every month when past days are allowed, or when the window is a later year", () => {
		expect(reachableMonths({ year: 2026, carryOverMonths: 0, allowPastDays: true, today }).size).toBe(MONTHS_IN_YEAR);
		expect(reachableMonths({ year: 2027, carryOverMonths: 0, allowPastDays: false, today }).size).toBe(MONTHS_IN_YEAR);
	});

	it("reaches every month while today is not known yet, since nothing can be behind a day nobody has read", () => {
		const reachable = reachableMonths({ year: 2026, carryOverMonths: 0, allowPastDays: false, today: null });

		expect(reachable.size).toBe(MONTHS_IN_YEAR);
	});

	it("keeps only the Preferred Months the window can still reach", () => {
		const reachable = reachableMonths({ year: 2026, carryOverMonths: 0, allowPastDays: false, today });

		expect(reachablePreferredMonths({ preferredMonths: [6, 7, 11], reachable })).toStrictEqual([11]);
	});
});

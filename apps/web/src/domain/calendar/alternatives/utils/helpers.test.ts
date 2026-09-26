import { PTO_CONSTANTS } from "@domain/calendar/const";
import { describe, expect, it } from "vitest";
import { coveredDays, planDistance, restBlocksOf } from "./helpers";

const jan = (day: number) => new Date(2025, 0, day);

describe("planDistance", () => {
	it("is zero for the same plan, whatever the order of its days", () => {
		expect(planDistance({ plan: [jan(3), jan(10)], rival: [jan(10), jan(3)] })).toBe(0);
	});

	it("is one for plans that share no day", () => {
		expect(planDistance({ plan: [jan(3)], rival: [jan(10)] })).toBe(1);
	});

	it("is the share of the combined days the plans do not have in common", () => {
		expect(planDistance({ plan: [jan(3), jan(10), jan(17)], rival: [jan(3), jan(10), jan(24)] })).toBe(0.5);
	});

	it("matches days by calendar date, not by the time of day", () => {
		expect(planDistance({ plan: [new Date(2025, 0, 3, 12)], rival: [jan(3)] })).toBe(0);
	});

	it("is zero for two empty plans rather than NaN", () => {
		expect(planDistance({ plan: [], rival: [] })).toBe(0);
	});
});

describe("coveredDays", () => {
	const friday = {
		startDate: jan(10),
		endDate: jan(12),
		ptoDays: [jan(10)],
		ptoDaysNeeded: 1,
		effectiveDays: 3,
		efficiency: 3,
	};
	const monday = {
		startDate: jan(11),
		endDate: jan(13),
		ptoDays: [jan(13)],
		ptoDaysNeeded: 1,
		effectiveDays: 3,
		efficiency: 3,
	};

	it("counts a weekend two Bridges share once", () => {
		expect(coveredDays({ days: [jan(10), jan(13)], bridges: [friday, monday] })).toBe(4);
	});

	it("counts a placed day no Bridge covers as itself", () => {
		expect(coveredDays({ days: [jan(10), jan(15)], bridges: [friday] })).toBe(4);
	});

	it("counts only the placed days when there are no Bridges", () => {
		expect(coveredDays({ days: [jan(10), jan(15)] })).toBe(2);
	});
});

describe("restBlocksOf", () => {
	it("groups days no further apart than REST_BLOCK_SEPARATION_DAYS, largest block first", () => {
		const blocks = restBlocksOf([new Date(2025, 2, 3), jan(3), new Date(2025, 2, 4)]);

		expect(blocks.map((block) => block.length)).toEqual([2, 1]);
	});

	it("keeps two days exactly REST_BLOCK_SEPARATION_DAYS apart in one block and splits them one day further", () => {
		const separation = PTO_CONSTANTS.METRICS.REST_BLOCK_SEPARATION_DAYS;

		expect(restBlocksOf([jan(1), jan(1 + separation)])).toHaveLength(1);
		expect(restBlocksOf([jan(1), jan(2 + separation)])).toHaveLength(2);
	});

	it("answers no blocks for no days", () => {
		expect(restBlocksOf([])).toEqual([]);
	});
});

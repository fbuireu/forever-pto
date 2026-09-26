import { dayIndex } from "@application/shared/utils/dates";
import { PTO_CONSTANTS } from "@domain/calendar/const";
import type { Bridge } from "@domain/calendar/types";
import { FilterStrategy } from "@domain/calendar/types";
import { clearDateKeyCache, clearHolidayCache } from "@domain/calendar/utils/cache";
import { beforeEach, describe, expect, it } from "vitest";
import { objectiveFor, STRATEGY_OBJECTIVE, selectBridges, selectBridgesForStrategy } from "./selectors";

beforeEach(() => {
	clearDateKeyCache();
	clearHolidayCache();
});

const jan = (day: number) => new Date(2025, 0, day);
const on = ({ month, day }: { month: number; day: number }) => new Date(2025, month - 1, day);

interface MakeBridgeParams {
	from: Date;
	to: Date;
	ptoDays: Date[];
}

const makeBridge = ({ from, to, ptoDays }: MakeBridgeParams): Bridge => {
	const effectiveDays = dayIndex(to) - dayIndex(from) + 1;

	return {
		startDate: from,
		endDate: to,
		ptoDaysNeeded: ptoDays.length,
		effectiveDays,
		efficiency: effectiveDays / ptoDays.length,
		ptoDays,
	};
};

const week = ({ monday, from, to }: { monday: Date; from: Date; to: Date }) =>
	makeBridge({
		from,
		to,
		ptoDays: Array.from(
			{ length: 5 },
			(_, i) => new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i),
		),
	});

const friday10 = makeBridge({ from: jan(10), to: jan(12), ptoDays: [jan(10)] });
const monday13 = makeBridge({ from: jan(11), to: jan(13), ptoDays: [jan(13)] });
const friday17 = makeBridge({ from: jan(17), to: jan(19), ptoDays: [jan(17)] });
const friday31 = makeBridge({ from: jan(31), to: on({ month: 2, day: 2 }), ptoDays: [jan(31)] });
const fridayBeforeHoliday = makeBridge({ from: jan(3), to: jan(6), ptoDays: [jan(3)] });

const toStrings = (days: Date[]) => days.map((day) => day.toDateString());

describe("selectBridgesForStrategy, every Strategy", () => {
	it.each(Object.values(FilterStrategy))("%s: returns an empty result for no bridges", (strategy) => {
		const result = selectBridgesForStrategy({ bridges: [], targetPtoDays: 5, strategy });
		expect(result.days).toHaveLength(0);
		expect(result.bridges).toHaveLength(0);
	});

	it.each(Object.values(FilterStrategy))("%s: never exceeds the budget", (strategy) => {
		const result = selectBridgesForStrategy({
			bridges: [friday10, friday17, friday31, fridayBeforeHoliday],
			targetPtoDays: 2,
			strategy,
		});
		expect(result.bridges.reduce((sum, bridge) => sum + bridge.ptoDaysNeeded, 0)).toBeLessThanOrEqual(2);
	});

	it.each(Object.values(FilterStrategy))("%s: never places the same day twice", (strategy) => {
		const overlapping = makeBridge({ from: jan(10), to: jan(14), ptoDays: [jan(13), jan(14)] });
		const result = selectBridgesForStrategy({ bridges: [monday13, overlapping], targetPtoDays: 3, strategy });
		expect(new Set(toStrings(result.days)).size).toBe(result.days.length);
	});

	it.each(Object.values(FilterStrategy))("%s: returns its days chronologically", (strategy) => {
		const result = selectBridgesForStrategy({
			bridges: [friday31, friday17, fridayBeforeHoliday],
			targetPtoDays: 3,
			strategy,
		});
		expect(result.days.map((day) => day.getTime())).toEqual(
			result.days.map((day) => day.getTime()).toSorted((a, b) => a - b),
		);
	});

	it("plans an unknown Strategy as GROUPED", () => {
		expect(objectiveFor("unknown" as FilterStrategy)).toBe(STRATEGY_OBJECTIVE[FilterStrategy.GROUPED]);
	});
});

describe("the marginal gain", () => {
	it("counts a weekend two Bridges share once, so the second one is worth a single day", () => {
		const { days } = selectBridgesForStrategy({
			bridges: [friday10, monday13, friday17],
			targetPtoDays: 2,
			strategy: FilterStrategy.OPTIMIZED,
		});

		expect(toStrings(days)).toEqual(toStrings([jan(10), jan(17)]));
	});

	it("leaves budget unspent rather than take a day that adds less than the floor", () => {
		const { days } = selectBridgesForStrategy({
			bridges: [friday10, monday13],
			targetPtoDays: 2,
			strategy: FilterStrategy.OPTIMIZED,
		});

		expect(toStrings(days)).toEqual(toStrings([jan(10)]));
	});

	it("never places an excluded day, whatever it would add", () => {
		const { days } = selectBridges({
			bridges: [fridayBeforeHoliday, friday10],
			targetPtoDays: 1,
			objective: STRATEGY_OBJECTIVE[FilterStrategy.OPTIMIZED],
			excludedDays: [jan(3)],
		});

		expect(toStrings(days)).toEqual(toStrings([jan(10)]));
	});
});

describe("OPTIMIZED", () => {
	it("takes the Bridge that adds most per PTO Day first", () => {
		const { days } = selectBridgesForStrategy({
			bridges: [friday10, fridayBeforeHoliday],
			targetPtoDays: 1,
			strategy: FilterStrategy.OPTIMIZED,
		});

		expect(toStrings(days)).toEqual(toStrings([jan(3)]));
	});

	it("breaks a tie by distance from the breaks already taken, not by date", () => {
		const { days } = selectBridgesForStrategy({
			bridges: [friday10, friday17, friday31],
			targetPtoDays: 2,
			strategy: FilterStrategy.OPTIMIZED,
		});

		expect(toStrings(days)).toEqual(toStrings([jan(10), jan(31)]));
	});

	it("refuses a working week, which returns under the floor", () => {
		const block = week({ monday: jan(13), from: jan(11), to: jan(19) });
		const { days } = selectBridgesForStrategy({
			bridges: [block],
			targetPtoDays: 5,
			strategy: FilterStrategy.OPTIMIZED,
		});

		expect(block.efficiency).toBeLessThan(PTO_CONSTANTS.EFFICIENCY.MINIMUM);
		expect(days).toHaveLength(0);
	});
});

describe("GROUPED", () => {
	const first = week({ monday: jan(13), from: jan(11), to: jan(19) });
	const second = week({ monday: jan(20), from: jan(18), to: jan(26) });
	const third = week({ monday: jan(27), from: jan(25), to: on({ month: 2, day: 2 }) });
	const march = week({
		monday: on({ month: 3, day: 3 }),
		from: on({ month: 3, day: 1 }),
		to: on({ month: 3, day: 9 }),
	});

	it("takes a working week over a sharper single day, because the stretch is what it ranks", () => {
		const { bridges } = selectBridgesForStrategy({
			bridges: [fridayBeforeHoliday, first],
			targetPtoDays: 5,
			strategy: FilterStrategy.GROUPED,
		});

		expect(bridges).toEqual([first]);
	});

	it("grows a block it already holds before starting another one", () => {
		const { bridges } = selectBridgesForStrategy({
			bridges: [first, march, second],
			targetPtoDays: 10,
			strategy: FilterStrategy.GROUPED,
		});

		expect(bridges).toEqual([first, second]);
	});

	it("starts a new block once the current one would pass GROUPED_MAX_BLOCK_DAYS", () => {
		const { bridges } = selectBridgesForStrategy({
			bridges: [first, second, third, march],
			targetPtoDays: 15,
			strategy: FilterStrategy.GROUPED,
		});

		expect(PTO_CONSTANTS.SELECTION.GROUPED_MAX_BLOCK_DAYS).toBe(16);
		expect(bridges).toEqual([first, second, march]);
	});
});

describe("BALANCED", () => {
	const aprilFriday = makeBridge({
		from: on({ month: 4, day: 4 }),
		to: on({ month: 4, day: 6 }),
		ptoDays: [on({ month: 4, day: 4 })],
	});
	const januaryMonday = makeBridge({ from: jan(18), to: jan(21), ptoDays: [jan(20)] });

	it("gives every quarter its share of the budget before any quarter gets more", () => {
		const { days } = selectBridgesForStrategy({
			bridges: [fridayBeforeHoliday, januaryMonday, aprilFriday],
			targetPtoDays: 2,
			strategy: FilterStrategy.BALANCED,
		});

		expect(toStrings(days)).toEqual(toStrings([jan(3), on({ month: 4, day: 4 })]));
	});

	it("prefers the longer break within a quarter, up to BALANCED_MAX_BLOCK_DAYS", () => {
		const thursdayFriday = makeBridge({ from: jan(9), to: jan(12), ptoDays: [jan(9), jan(10)] });
		const { bridges } = selectBridgesForStrategy({
			bridges: [friday17, thursdayFriday],
			targetPtoDays: 2,
			strategy: FilterStrategy.BALANCED,
		});

		expect(bridges).toEqual([thursdayFriday]);
	});
});

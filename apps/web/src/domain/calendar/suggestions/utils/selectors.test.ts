import type { Bridge } from "@domain/calendar/types";
import { FilterStrategy } from "@domain/calendar/types";
import { clearDateKeyCache, clearHolidayCache } from "@domain/calendar/utils/cache";
import { beforeEach, describe, expect, it } from "vitest";
import { selectBridgesForStrategy } from "./selectors";

beforeEach(() => {
	clearDateKeyCache();
	clearHolidayCache();
});

interface MakeDateParams {
	year: number;
	month: number;
	day: number;
}

const makeDate = ({ year, month, day }: MakeDateParams) => new Date(year, month - 1, day);

interface MakeBridgeParams {
	ptoDays: Date[];
	effectiveDays: number;
}

const makeBridge = ({ ptoDays, effectiveDays }: MakeBridgeParams): Bridge => ({
	startDate: ptoDays[0],
	endDate: ptoDays[ptoDays.length - 1],
	ptoDaysNeeded: ptoDays.length,
	effectiveDays,
	efficiency: effectiveDays / ptoDays.length,
	ptoDays,
});

const bridgeA = makeBridge({ ptoDays: [makeDate({ year: 2025, month: 1, day: 6 })], effectiveDays: 3 });
const bridgeB = makeBridge({
	ptoDays: [makeDate({ year: 2025, month: 1, day: 9 }), makeDate({ year: 2025, month: 1, day: 10 })],
	effectiveDays: 4,
});
const bridgeC = makeBridge({ ptoDays: [makeDate({ year: 2025, month: 1, day: 7 })], effectiveDays: 3 });
const bridgeShortHigh = makeBridge({ ptoDays: [makeDate({ year: 2025, month: 1, day: 13 })], effectiveDays: 2.7 });
const bridgeLong = makeBridge({
	ptoDays: [
		makeDate({ year: 2025, month: 1, day: 20 }),
		makeDate({ year: 2025, month: 1, day: 21 }),
		makeDate({ year: 2025, month: 1, day: 22 }),
	],
	effectiveDays: 8,
});
const bridgeShortTop = makeBridge({ ptoDays: [makeDate({ year: 2025, month: 1, day: 13 })], effectiveDays: 3 });

describe("selectBridgesForStrategy", () => {
	it("returns empty result for empty bridges", () => {
		const result = selectBridgesForStrategy({ bridges: [], targetPtoDays: 5, strategy: FilterStrategy.GROUPED });
		expect(result.days).toHaveLength(0);
		expect(result.bridges).toHaveLength(0);
	});

	it("GROUPED prefers multi-day bridges over single-day ones", () => {
		const result = selectBridgesForStrategy({
			bridges: [bridgeA, bridgeB, bridgeC],
			targetPtoDays: 2,
			strategy: FilterStrategy.GROUPED,
		});
		expect(result.bridges).toContain(bridgeB);
		expect(
			result.days.some((day) => day.toDateString() === makeDate({ year: 2025, month: 1, day: 9 }).toDateString()),
		).toBe(true);
	});

	it("OPTIMIZED prefers high-efficiency bridges", () => {
		const result = selectBridgesForStrategy({
			bridges: [bridgeA, bridgeB, bridgeC],
			targetPtoDays: 2,
			strategy: FilterStrategy.OPTIMIZED,
		});
		expect(result.bridges).toContain(bridgeA);
		expect(result.bridges).toContain(bridgeC);
		expect(result.bridges).not.toContain(bridgeB);
	});

	it("OPTIMIZED breaks a near-tie in efficiency by preferring the longer stretch off", () => {
		const result = selectBridgesForStrategy({
			bridges: [bridgeShortHigh, bridgeLong],
			targetPtoDays: 3,
			strategy: FilterStrategy.OPTIMIZED,
		});
		expect(result.bridges).toContain(bridgeLong);
		expect(result.bridges).not.toContain(bridgeShortHigh);
	});

	it("OPTIMIZED still ranks by raw efficiency when the gap exceeds the tie threshold", () => {
		const result = selectBridgesForStrategy({
			bridges: [bridgeShortTop, bridgeLong],
			targetPtoDays: 3,
			strategy: FilterStrategy.OPTIMIZED,
		});
		expect(result.bridges).toContain(bridgeShortTop);
		expect(result.bridges).not.toContain(bridgeLong);
	});

	it("admits bridges down to the strategy-agnostic minimum efficiency — OPTIMIZED has no higher floor", () => {
		const optimized = selectBridgesForStrategy({
			bridges: [bridgeB],
			targetPtoDays: 2,
			strategy: FilterStrategy.OPTIMIZED,
		});
		const balanced = selectBridgesForStrategy({
			bridges: [bridgeB],
			targetPtoDays: 2,
			strategy: FilterStrategy.BALANCED,
		});
		expect(bridgeB.efficiency).toBe(2);
		expect(optimized.days).toHaveLength(2);
		expect(balanced.days).toHaveLength(2);
	});

	it("presorted keeps the caller ordering instead of re-sorting", () => {
		const bridges = [bridgeA, bridgeC, bridgeB];
		const resorted = selectBridgesForStrategy({ bridges, targetPtoDays: 2, strategy: FilterStrategy.GROUPED });
		const kept = selectBridgesForStrategy({
			bridges,
			targetPtoDays: 2,
			strategy: FilterStrategy.GROUPED,
			presorted: true,
		});
		expect(resorted.bridges).toEqual([bridgeB]);
		expect(kept.bridges).toEqual([bridgeA, bridgeC]);
	});

	it("does not exceed targetPtoDays", () => {
		const result = selectBridgesForStrategy({
			bridges: [bridgeA, bridgeB, bridgeC],
			targetPtoDays: 1,
			strategy: FilterStrategy.OPTIMIZED,
		});
		const total = result.bridges.reduce((sum, b) => sum + b.ptoDaysNeeded, 0);
		expect(total).toBeLessThanOrEqual(1);
	});

	it("does not select conflicting bridges", () => {
		const conflicting = makeBridge({
			ptoDays: [makeDate({ year: 2025, month: 1, day: 6 }), makeDate({ year: 2025, month: 1, day: 7 })],
			effectiveDays: 5,
		});
		const result = selectBridgesForStrategy({
			bridges: [bridgeA, conflicting],
			targetPtoDays: 3,
			strategy: FilterStrategy.GROUPED,
		});
		const jan6Count = result.days.filter((day) => day.toDateString() === new Date(2025, 0, 6).toDateString()).length;
		expect(jan6Count).toBeLessThanOrEqual(1);
	});

	it("returns days sorted chronologically", () => {
		const result = selectBridgesForStrategy({
			bridges: [bridgeC, bridgeA],
			targetPtoDays: 2,
			strategy: FilterStrategy.OPTIMIZED,
		});
		for (let i = 1; i < result.days.length; i++) {
			expect(result.days[i - 1].getTime()).toBeLessThanOrEqual(result.days[i].getTime());
		}
	});
});

describe("selectBridgesForStrategy, BALANCED", () => {
	it("returns empty result for empty bridges", () => {
		const result = selectBridgesForStrategy({ bridges: [], targetPtoDays: 5, strategy: FilterStrategy.BALANCED });
		expect(result.days).toHaveLength(0);
		expect(result.bridges).toHaveLength(0);
	});

	it("selects bridges without exceeding targetPtoDays", () => {
		const result = selectBridgesForStrategy({
			bridges: [bridgeA, bridgeB, bridgeC],
			targetPtoDays: 2,
			strategy: FilterStrategy.BALANCED,
		});
		const total = result.bridges.reduce((sum, b) => sum + b.ptoDaysNeeded, 0);
		expect(total).toBeLessThanOrEqual(2);
	});

	it("does not select conflicting bridges", () => {
		const overlap = makeBridge({ ptoDays: [makeDate({ year: 2025, month: 1, day: 6 })], effectiveDays: 3 });
		const result = selectBridgesForStrategy({
			bridges: [bridgeA, overlap],
			targetPtoDays: 2,
			strategy: FilterStrategy.BALANCED,
		});
		const jan6Count = result.days.filter((day) => day.toDateString() === new Date(2025, 0, 6).toDateString()).length;
		expect(jan6Count).toBe(1);
	});

	it("presorted keeps the caller ordering instead of re-scoring", () => {
		const bridges = [bridgeB, bridgeA];
		const rescored = selectBridgesForStrategy({ bridges, targetPtoDays: 2, strategy: FilterStrategy.BALANCED });
		const kept = selectBridgesForStrategy({
			bridges,
			targetPtoDays: 2,
			presorted: true,
			strategy: FilterStrategy.BALANCED,
		});
		expect(rescored.days).toEqual(bridgeA.ptoDays);
		expect(kept.days).toEqual(bridgeB.ptoDays);
	});

	it("leaves the budget unspent when every remaining single-day bridge is already taken", () => {
		const highValue = makeBridge({
			ptoDays: [
				makeDate({ year: 2025, month: 1, day: 20 }),
				makeDate({ year: 2025, month: 1, day: 21 }),
				makeDate({ year: 2025, month: 1, day: 22 }),
			],
			effectiveDays: 9,
		});
		const conflicting = makeBridge({ ptoDays: [makeDate({ year: 2025, month: 1, day: 20 })], effectiveDays: 3 });
		const result = selectBridgesForStrategy({
			bridges: [highValue, conflicting],
			targetPtoDays: 4,
			strategy: FilterStrategy.BALANCED,
		});
		expect(result.bridges).toHaveLength(1);
		expect(result.days).toEqual(highValue.ptoDays);
	});

	it("returns days sorted chronologically", () => {
		const result = selectBridgesForStrategy({
			bridges: [bridgeC, bridgeA],
			targetPtoDays: 2,
			strategy: FilterStrategy.BALANCED,
		});
		for (let i = 1; i < result.days.length; i++) {
			expect(result.days[i - 1].getTime()).toBeLessThanOrEqual(result.days[i].getTime());
		}
	});
});

describe("the BALANCED ordering, high-value first", () => {
	it("takes the high-value block before the crowd of cheap bridges that would exhaust the budget", () => {
		const highValueThreeDaysNineEffective = makeBridge({
			ptoDays: [
				makeDate({ year: 2025, month: 4, day: 14 }),
				makeDate({ year: 2025, month: 4, day: 15 }),
				makeDate({ year: 2025, month: 4, day: 16 }),
			],
			effectiveDays: 9,
		});
		const cheapOne = makeBridge({ ptoDays: [makeDate({ year: 2025, month: 2, day: 3 })], effectiveDays: 3 });
		const cheapTwo = makeBridge({ ptoDays: [makeDate({ year: 2025, month: 3, day: 3 })], effectiveDays: 3 });
		const cheapThree = makeBridge({ ptoDays: [makeDate({ year: 2025, month: 5, day: 5 })], effectiveDays: 3 });

		const { bridges: selected } = selectBridgesForStrategy({
			bridges: [cheapOne, cheapTwo, cheapThree, highValueThreeDaysNineEffective],
			targetPtoDays: 3,
			strategy: FilterStrategy.BALANCED,
		});

		expect(selected).toContain(highValueThreeDaysNineEffective);
		expect(selected).toHaveLength(1);
	});

	it("rescues a long block the score alone would have lost to three cheaper bridges", () => {
		const block = makeBridge({
			ptoDays: [
				makeDate({ year: 2025, month: 4, day: 14 }),
				makeDate({ year: 2025, month: 4, day: 15 }),
				makeDate({ year: 2025, month: 4, day: 16 }),
			],
			effectiveDays: 9,
		});
		const cheap = [
			makeDate({ year: 2025, month: 2, day: 3 }),
			makeDate({ year: 2025, month: 3, day: 3 }),
			makeDate({ year: 2025, month: 5, day: 5 }),
		].map((day) => makeBridge({ ptoDays: [day], effectiveDays: 6 }));

		const { bridges: selected } = selectBridgesForStrategy({
			bridges: [...cheap, block],
			targetPtoDays: 3,
			strategy: FilterStrategy.BALANCED,
		});

		expect(selected).toEqual([block]);
	});
});

describe("BALANCED scoring formula", () => {
	const orderOf = (bridges: Bridge[]) =>
		selectBridgesForStrategy({ bridges, targetPtoDays: 99, strategy: FilterStrategy.BALANCED }).bridges.map(
			(bridge) => bridge.effectiveDays,
		);

	it("divides the span by ten so a long low-efficiency bridge cannot outscore a short efficient one", () => {
		const efficient = makeBridge({ ptoDays: [makeDate({ year: 2025, month: 2, day: 3 })], effectiveDays: 4 });
		const long = makeBridge({
			ptoDays: [
				makeDate({ year: 2025, month: 3, day: 3 }),
				makeDate({ year: 2025, month: 3, day: 4 }),
				makeDate({ year: 2025, month: 3, day: 5 }),
			],
			effectiveDays: 8,
		});

		expect(orderOf([long, efficient])).toEqual([4, 8]);
	});

	it("weights efficiency at 0.6 over span at 0.4, so 5.40 beats 5.04 where a swap would make it 4.35 against 4.56", () => {
		const sharper = makeBridge({
			ptoDays: [
				makeDate({ year: 2025, month: 2, day: 3 }),
				makeDate({ year: 2025, month: 2, day: 4 }),
				makeDate({ year: 2025, month: 2, day: 5 }),
			],
			effectiveDays: 15,
		});
		const broader = makeBridge({
			ptoDays: [
				makeDate({ year: 2025, month: 4, day: 7 }),
				makeDate({ year: 2025, month: 4, day: 8 }),
				makeDate({ year: 2025, month: 4, day: 9 }),
				makeDate({ year: 2025, month: 4, day: 10 }),
				makeDate({ year: 2025, month: 4, day: 11 }),
				makeDate({ year: 2025, month: 4, day: 14 }),
			],
			effectiveDays: 24,
		});

		expect(orderOf([broader, sharper])).toEqual([15, 24]);
	});

	it("bonuses a long 2.4-efficiency bridge the high-value pass skips, lifting 1.92 to 2.88 over a 2.56 rival", () => {
		const longButOrdinary = makeBridge({
			ptoDays: [
				makeDate({ year: 2025, month: 5, day: 5 }),
				makeDate({ year: 2025, month: 5, day: 6 }),
				makeDate({ year: 2025, month: 5, day: 7 }),
				makeDate({ year: 2025, month: 5, day: 8 }),
				makeDate({ year: 2025, month: 5, day: 9 }),
			],
			effectiveDays: 12,
		});
		const sharpAndSmall = makeBridge({ ptoDays: [makeDate({ year: 2025, month: 6, day: 2 })], effectiveDays: 4 });

		expect(orderOf([sharpAndSmall, longButOrdinary])).toEqual([12, 4]);
	});
});

import { dayIndex } from "@application/shared/utils/dates";
import { PTO_CONSTANTS } from "@domain/calendar/const";
import type { Bridge } from "@domain/calendar/types";
import { FilterStrategy } from "@domain/calendar/types";
import { clearDateKeyCache, clearHolidayCache } from "@domain/calendar/utils/cache";
import { beforeEach, describe, expect, it } from "vitest";
import { objectiveFor, STRATEGY_OBJECTIVE, selectBridges, selectBridgesForStrategy } from "./selectors";

const NO_CALENDAR = { workdays: [], alreadyOff: [] };

beforeEach(() => {
	clearDateKeyCache();
	clearHolidayCache();
});

const jan = (day: number) => new Date(2025, 0, day);
interface OnParams {
	month: number;
	day: number;
}

const on = ({ month, day }: OnParams) => new Date(2025, month - 1, day);

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

interface WeekParams {
	monday: Date;
	from: Date;
	to: Date;
}

const week = ({ monday, from, to }: WeekParams) =>
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

interface DateRangeParams {
	from: Date;
	to: Date;
}

describe("selectBridgesForStrategy, every Strategy", () => {
	it.each(Object.values(FilterStrategy))("%s: returns an empty result for no bridges", (strategy) => {
		const result = selectBridgesForStrategy({ ...NO_CALENDAR, bridges: [], targetPtoDays: 5, strategy });
		expect(result.days).toHaveLength(0);
		expect(result.bridges).toHaveLength(0);
	});

	it.each(Object.values(FilterStrategy))("%s: never exceeds the budget", (strategy) => {
		const result = selectBridgesForStrategy({
			...NO_CALENDAR,
			bridges: [friday10, friday17, friday31, fridayBeforeHoliday],
			targetPtoDays: 2,
			strategy,
		});
		expect(result.bridges.reduce((sum, bridge) => sum + bridge.ptoDaysNeeded, 0)).toBeLessThanOrEqual(2);
	});

	it.each(Object.values(FilterStrategy))("%s: never places the same day twice", (strategy) => {
		const mondayTuesday = makeBridge({ from: jan(11), to: jan(14), ptoDays: [jan(13), jan(14)] });
		const tuesdayWednesday = makeBridge({ from: jan(14), to: jan(19), ptoDays: [jan(14), jan(15)] });
		const result = selectBridgesForStrategy({
			...NO_CALENDAR,
			bridges: [mondayTuesday, tuesdayWednesday],
			targetPtoDays: 4,
			strategy,
		});

		expect(new Set(toStrings(result.days)).size).toBe(result.days.length);
	});

	it.each(Object.values(FilterStrategy))("%s: skips a Bridge that costs more than the budget left", (strategy) => {
		const thursdayFriday = makeBridge({ from: jan(9), to: jan(12), ptoDays: [jan(9), jan(10)] });
		const result = selectBridgesForStrategy({ ...NO_CALENDAR, bridges: [thursdayFriday], targetPtoDays: 1, strategy });

		expect(result.days).toEqual([]);
	});

	it.each(Object.values(FilterStrategy))("%s: returns its days chronologically", (strategy) => {
		const result = selectBridgesForStrategy({
			...NO_CALENDAR,
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
			...NO_CALENDAR,
			bridges: [friday10, monday13, friday17],
			targetPtoDays: 2,
			strategy: FilterStrategy.OPTIMIZED,
		});

		expect(toStrings(days)).toEqual(toStrings([jan(10), jan(17)]));
	});

	it("leaves budget unspent rather than take a day that adds less than the floor", () => {
		const { days } = selectBridgesForStrategy({
			...NO_CALENDAR,
			bridges: [friday10, monday13],
			targetPtoDays: 2,
			strategy: FilterStrategy.OPTIMIZED,
		});

		expect(toStrings(days)).toEqual(toStrings([jan(10)]));
	});

	it("counts the weekend a Manual Day already covers as no gain", () => {
		const { days } = selectBridges({
			...NO_CALENDAR,
			bridges: [friday10, friday17],
			targetPtoDays: 1,
			objective: STRATEGY_OBJECTIVE[FilterStrategy.OPTIMIZED],
			alreadyOff: [jan(11), jan(12), jan(13)],
		});

		expect(toStrings(days)).toEqual(toStrings([jan(17)]));
	});

	it("never places a forbidden day, whatever it would add", () => {
		const { days } = selectBridges({
			...NO_CALENDAR,
			bridges: [fridayBeforeHoliday, friday10],
			targetPtoDays: 1,
			objective: STRATEGY_OBJECTIVE[FilterStrategy.OPTIMIZED],
			forbiddenDays: [jan(3)],
		});

		expect(toStrings(days)).toEqual(toStrings([jan(10)]));
	});
});

describe("OPTIMIZED", () => {
	it("takes the Bridge that adds most per PTO Day first", () => {
		const { days } = selectBridgesForStrategy({
			...NO_CALENDAR,
			bridges: [friday10, fridayBeforeHoliday],
			targetPtoDays: 1,
			strategy: FilterStrategy.OPTIMIZED,
		});

		expect(toStrings(days)).toEqual(toStrings([jan(3)]));
	});

	it("breaks a tie by distance from the Bridges already taken, not by date", () => {
		const { days } = selectBridgesForStrategy({
			...NO_CALENDAR,
			bridges: [friday10, friday17, friday31],
			targetPtoDays: 2,
			strategy: FilterStrategy.OPTIMIZED,
		});

		expect(toStrings(days)).toEqual(toStrings([jan(10), jan(31)]));
	});

	it("refuses a working week, which returns under the floor", () => {
		const block = week({ monday: jan(13), from: jan(11), to: jan(19) });
		const { days } = selectBridgesForStrategy({
			...NO_CALENDAR,
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
			...NO_CALENDAR,
			bridges: [fridayBeforeHoliday, first],
			targetPtoDays: 5,
			strategy: FilterStrategy.GROUPED,
		});

		expect(bridges).toEqual([first]);
	});

	it("grows a block it already holds before starting another one", () => {
		const { bridges } = selectBridgesForStrategy({
			...NO_CALENDAR,
			bridges: [first, march, second],
			targetPtoDays: 10,
			strategy: FilterStrategy.GROUPED,
		});

		expect(bridges).toEqual([first, second]);
	});

	it("starts a new block once the current one would pass GROUPED_MAX_BLOCK_DAYS", () => {
		const { bridges } = selectBridgesForStrategy({
			...NO_CALENDAR,
			bridges: [first, second, third, march],
			targetPtoDays: 15,
			strategy: FilterStrategy.GROUPED,
		});

		expect(PTO_CONSTANTS.SELECTION.GROUPED_MAX_BLOCK_DAYS).toBe(16);
		expect(bridges).toEqual([first, second, march]);
	});
});

describe("BALANCED", () => {
	const weekdaysBetween = ({ from, to }: DateRangeParams) => {
		const days: Date[] = [];
		for (let day = new Date(from); day <= to; day = new Date(day.getFullYear(), day.getMonth(), day.getDate() + 1)) {
			if (day.getDay() !== 0 && day.getDay() !== 6) days.push(day);
		}
		return days;
	};
	const fridayOn = (date: Date) =>
		makeBridge({ from: date, to: new Date(date.getFullYear(), date.getMonth(), date.getDate() + 2), ptoDays: [date] });
	const winter = weekdaysBetween({ from: jan(13), to: on({ month: 2, day: 28 }) });
	const fridays = [jan(17), jan(31), on({ month: 2, day: 14 }), on({ month: 2, day: 28 })].map(fridayOn);

	it("splits the longest stretch of Workdays first, where OPTIMIZED would take the earliest tie", () => {
		const balanced = selectBridgesForStrategy({
			...NO_CALENDAR,
			bridges: fridays,
			targetPtoDays: 2,
			strategy: FilterStrategy.BALANCED,
			workdays: winter,
		});
		const optimized = selectBridgesForStrategy({
			...NO_CALENDAR,
			bridges: fridays,
			targetPtoDays: 1,
			strategy: FilterStrategy.OPTIMIZED,
			workdays: winter,
		});

		expect(toStrings(balanced.days)).toEqual(toStrings([jan(31), on({ month: 2, day: 14 })]));
		expect(toStrings(optimized.days)).toEqual(toStrings([jan(17)]));
	});

	it("does not break a stretch at a weekend, and does at a Holiday", () => {
		const holidayFriday = winter.filter((day) => day.toDateString() !== jan(31).toDateString());
		const { days } = selectBridgesForStrategy({
			...NO_CALENDAR,
			bridges: [fridays[0], fridays[2]].filter((bridge) => bridge !== undefined),
			targetPtoDays: 1,
			strategy: FilterStrategy.BALANCED,
			workdays: holidayFriday,
		});

		expect(toStrings(days)).toEqual(toStrings([on({ month: 2, day: 14 })]));
	});

	it("prefers the longer stretch off when the stretches of work tie, up to BALANCED_MAX_BLOCK_DAYS", () => {
		const thursdayFriday = makeBridge({ from: jan(9), to: jan(12), ptoDays: [jan(9), jan(10)] });
		const { bridges } = selectBridgesForStrategy({
			...NO_CALENDAR,
			bridges: [friday17, thursdayFriday],
			targetPtoDays: 2,
			strategy: FilterStrategy.BALANCED,
		});

		expect(bridges).toEqual([thursdayFriday]);
	});
});

describe("MAIN_VACATION", () => {
	const july = week({
		monday: on({ month: 7, day: 7 }),
		from: on({ month: 7, day: 5 }),
		to: on({ month: 7, day: 13 }),
	});
	const julySecond = week({
		monday: on({ month: 7, day: 14 }),
		from: on({ month: 7, day: 12 }),
		to: on({ month: 7, day: 20 }),
	});
	const julyThird = week({
		monday: on({ month: 7, day: 21 }),
		from: on({ month: 7, day: 19 }),
		to: on({ month: 7, day: 27 }),
	});
	const march = week({
		monday: on({ month: 3, day: 3 }),
		from: on({ month: 3, day: 1 }),
		to: on({ month: 3, day: 9 }),
	});
	const julyMonths = [6];

	it("builds its block inside the preferred months before anything else, even against a sharper day", () => {
		const { bridges } = selectBridges({
			...NO_CALENDAR,
			bridges: [fridayBeforeHoliday, march, july],
			targetPtoDays: 5,
			objective: STRATEGY_OBJECTIVE[FilterStrategy.MAIN_VACATION],
			preferredMonths: julyMonths,
		});

		expect(bridges).toEqual([july]);
	});

	it("grows that one block up to MAIN_VACATION_BLOCK_DAYS and no further", () => {
		const { bridges } = selectBridges({
			...NO_CALENDAR,
			bridges: [july, julySecond, julyThird],
			targetPtoDays: 15,
			objective: STRATEGY_OBJECTIVE[FilterStrategy.MAIN_VACATION],
			preferredMonths: julyMonths,
		});

		expect(PTO_CONSTANTS.SELECTION.MAIN_VACATION_BLOCK_DAYS).toBe(16);
		expect(bridges).toEqual([july, julySecond]);
	});

	it("spends what the block leaves like OPTIMIZED, outside the preferred months too", () => {
		const { bridges } = selectBridges({
			...NO_CALENDAR,
			bridges: [march, fridayBeforeHoliday, friday17, july],
			targetPtoDays: 7,
			objective: STRATEGY_OBJECTIVE[FilterStrategy.MAIN_VACATION],
			preferredMonths: julyMonths,
		});

		expect(bridges).toEqual([july, fridayBeforeHoliday, friday17]);
	});

	it("takes the longest block anywhere when no month is preferred", () => {
		const { bridges } = selectBridges({
			...NO_CALENDAR,
			bridges: [fridayBeforeHoliday, march],
			targetPtoDays: 5,
			objective: STRATEGY_OBJECTIVE[FilterStrategy.MAIN_VACATION],
		});

		expect(bridges).toEqual([march]);
	});

	it("ignores the preferred months under every other Strategy", () => {
		const plain = selectBridgesForStrategy({
			...NO_CALENDAR,
			bridges: [march, july],
			targetPtoDays: 5,
			strategy: FilterStrategy.GROUPED,
		});
		const preferring = selectBridgesForStrategy({
			...NO_CALENDAR,
			bridges: [march, july],
			targetPtoDays: 5,
			strategy: FilterStrategy.GROUPED,
			preferredMonths: julyMonths,
		});

		expect(preferring.bridges).toEqual(plain.bridges);
	});
});

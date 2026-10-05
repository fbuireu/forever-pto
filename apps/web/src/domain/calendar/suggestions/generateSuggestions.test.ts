import type { HolidayDTO } from "@application/dto/holiday/types";
import { HolidayVariant } from "@application/dto/holiday/types";
import { Strategy } from "@domain/calendar/types";
import { clearDateKeyCache, clearHolidayCache } from "@domain/calendar/utils/cache";
import { findPlanningCandidates } from "@domain/calendar/utils/candidates";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { generateSuggestions } from "./generateSuggestions";
import { selectBridgesForStrategy } from "./utils/selectors";

interface PlanSuggestionsParams {
	ptoDays: number;
	holidays: HolidayDTO[];
	allowPastDays: boolean;
	months: Date[];
	strategy: Strategy;
	removedDays?: Date[];
}

const planSuggestions = ({ ptoDays, holidays, allowPastDays, months, strategy, removedDays }: PlanSuggestionsParams) =>
	generateSuggestions({
		ptoDays,
		strategy,
		candidates: findPlanningCandidates({ holidays, months, allowPastDays, removedDays, manualDays: [] }),
	});

vi.mock("./utils/selectors", async (importOriginal) => {
	const actual = await importOriginal<typeof import("./utils/selectors")>();
	return {
		selectBridgesForStrategy: vi.fn(actual.selectBridgesForStrategy),
	};
});

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

const BASE = {
	holidays: [] as ReturnType<typeof makeHoliday>[],
	allowPastDays: true,
	months: [makeDate({ year: 2025, month: 1, day: 1 })],
};

describe("generateSuggestions", () => {
	beforeEach(() => {
		clearDateKeyCache();
		clearHolidayCache();
		vi.clearAllMocks();
	});

	it("returns empty days when ptoDays is 0", () => {
		const result = planSuggestions({ ...BASE, ptoDays: 0, strategy: Strategy.GROUPED });
		expect(result.days).toHaveLength(0);
	});

	it("returns empty days when ptoDays is negative", () => {
		const result = planSuggestions({ ...BASE, ptoDays: -1, strategy: Strategy.GROUPED });
		expect(result.days).toHaveLength(0);
	});

	it("returns empty days when no available workdays (past month, allowPastDays=false)", () => {
		const result = planSuggestions({
			...BASE,
			ptoDays: 5,
			months: [makeDate({ year: 2020, month: 1, day: 1 })],
			allowPastDays: false,
			strategy: Strategy.GROUPED,
		});
		expect(result.days).toHaveLength(0);
	});

	it("includes the strategy in the result", () => {
		const result = planSuggestions({ ...BASE, ptoDays: 3, strategy: Strategy.OPTIMIZED });
		expect(result.strategy).toBe(Strategy.OPTIMIZED);
	});

	it("returns days sorted chronologically even where the Strategy picks a later Bridge first", () => {
		const months = Array.from({ length: 12 }, (_, index) => makeDate({ year: 2025, month: index + 1, day: 1 }));
		const holidays = [
			makeDate({ year: 2025, month: 1, day: 1 }),
			makeDate({ year: 2025, month: 5, day: 1 }),
			makeDate({ year: 2025, month: 12, day: 25 }),
		].map(makeHoliday);
		const result = planSuggestions({
			...BASE,
			months,
			holidays,
			ptoDays: 10,
			strategy: Strategy.OPTIMIZED,
		});
		const bridgeOrder = (result.bridges ?? []).flatMap((bridge) => bridge.ptoDays);

		expect(result.days).toHaveLength(10);
		for (let i = 1; i < result.days.length; i++) {
			expect(result.days[i - 1].getTime()).toBeLessThanOrEqual(result.days[i].getTime());
		}
		expect(bridgeOrder.map((day) => day.getTime())).not.toEqual(result.days.map((day) => day.getTime()));
	});

	it("never suggests a day that is already a holiday", () => {
		const holiday = makeHoliday(makeDate({ year: 2025, month: 1, day: 6 }));
		const result = planSuggestions({ ...BASE, ptoDays: 5, holidays: [holiday], strategy: Strategy.GROUPED });
		expect(result.days.length).toBeGreaterThan(0);
		expect(
			result.days.some((day) => day.toDateString() === makeDate({ year: 2025, month: 1, day: 6 }).toDateString()),
		).toBe(false);
	});

	it("ignores weekend holidays (they are not workdays)", () => {
		const weekendHoliday = makeHoliday(makeDate({ year: 2025, month: 1, day: 4 }));
		const result = planSuggestions({
			...BASE,
			ptoDays: 5,
			holidays: [weekendHoliday],
			strategy: Strategy.GROUPED,
		});
		expect(result.days.length).toBeGreaterThan(0);
	});

	it("does not return weekend days", () => {
		const result = planSuggestions({ ...BASE, ptoDays: 10, strategy: Strategy.OPTIMIZED });
		expect(result.days.length).toBeGreaterThan(0);
		for (const day of result.days) {
			expect(day.getDay()).not.toBe(0);
			expect(day.getDay()).not.toBe(6);
		}
	});

	it.each([[Strategy.GROUPED], [Strategy.OPTIMIZED], [Strategy.BALANCED]] as const)(
		"%s: returned days do not exceed ptoDays budget",
		(strategy) => {
			const ptoDays = 5;
			const result = planSuggestions({ ...BASE, ptoDays, strategy });
			expect(result.days.length).toBeGreaterThan(0);
			expect(result.days.length).toBeLessThanOrEqual(ptoDays);
		},
	);

	it("never places a Removed Day", () => {
		const removed = makeDate({ year: 2025, month: 1, day: 6 });
		const result = planSuggestions({
			...BASE,
			ptoDays: 5,
			removedDays: [removed],
			strategy: Strategy.GROUPED,
		});
		expect(result.days.length).toBeGreaterThan(0);
		expect(result.days.some((day) => day.toDateString() === removed.toDateString())).toBe(false);
	});

	it("does not let a Removed Day lengthen a neighbouring bridge", () => {
		const removed = makeDate({ year: 2025, month: 1, day: 6 });
		const result = planSuggestions({
			...BASE,
			ptoDays: 5,
			removedDays: [removed],
			strategy: Strategy.GROUPED,
		});
		expect(result.bridges?.length).toBeGreaterThan(0);
		const covering = result.bridges?.filter(
			(bridge) => bridge.startDate.getTime() <= removed.getTime() && removed.getTime() <= bridge.endDate.getTime(),
		);
		expect(result.bridges?.length).toBeGreaterThan(0);
		expect(covering).toEqual([]);
	});

	it("caps to available workdays if ptoDays exceeds them", () => {
		const result = planSuggestions({ ...BASE, ptoDays: 9999, strategy: Strategy.GROUPED });
		expect(result.days.length).toBeGreaterThan(0);
		expect(result.days.length).toBeLessThanOrEqual(23);
	});

	describe("strategy dispatch", () => {
		it.each([[Strategy.GROUPED], [Strategy.OPTIMIZED], [Strategy.BALANCED]] as const)(
			"hands %s to the selector unchanged",
			(strategy) => {
				planSuggestions({ ...BASE, ptoDays: 3, strategy });
				expect(selectBridgesForStrategy).toHaveBeenCalledWith(expect.objectContaining({ strategy }));
			},
		);

		it("plans an unknown strategy as GROUPED", () => {
			const unknown = planSuggestions({ ...BASE, ptoDays: 3, strategy: "unknown" as Strategy });
			const grouped = planSuggestions({ ...BASE, ptoDays: 3, strategy: Strategy.GROUPED });

			expect(unknown.days.map((day) => day.toDateString())).toEqual(grouped.days.map((day) => day.toDateString()));
		});
	});
});

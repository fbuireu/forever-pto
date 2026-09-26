import type { HolidayDTO } from "@application/dto/holiday/types";
import { HolidayVariant } from "@application/dto/holiday/types";
import { beforeEach, describe, expect, it } from "vitest";
import { PTO_CONSTANTS } from "../const";
import { selectBridgesForStrategy } from "../suggestions/utils/selectors";
import { FilterStrategy } from "../types";
import { clearDateKeyCache, clearHolidayCache } from "../utils/cache";
import { findPlanningCandidates } from "../utils/candidates";
import { generateAlternatives } from "./generateAlternatives";
import { planDistance } from "./utils/helpers";

const planAlternatives = ({
	ptoDays,
	holidays,
	allowPastDays,
	months,
	strategy,
	removedDays,
	maxAlternatives,
	existingSuggestion,
}: {
	ptoDays: number;
	holidays: HolidayDTO[];
	allowPastDays: boolean;
	months: Date[];
	strategy: FilterStrategy;
	removedDays?: Date[];
	maxAlternatives: number;
	existingSuggestion: Date[];
}) =>
	generateAlternatives({
		ptoDays,
		strategy,
		maxAlternatives,
		existingSuggestion,
		candidates: findPlanningCandidates({ holidays, months, allowPastDays, removedDays }),
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

const FULL_YEAR = Array.from({ length: 12 }, (_, index) => makeDate({ year: 2025, month: index + 1, day: 1 }));

const HOLIDAYS = [
	makeDate({ year: 2025, month: 1, day: 1 }),
	makeDate({ year: 2025, month: 5, day: 1 }),
	makeDate({ year: 2025, month: 12, day: 25 }),
].map(makeHoliday);

const BASE = {
	holidays: [] as ReturnType<typeof makeHoliday>[],
	allowPastDays: true,
	months: [makeDate({ year: 2025, month: 1, day: 1 })],
	strategy: FilterStrategy.GROUPED,
};

describe("generateAlternatives", () => {
	beforeEach(() => {
		clearDateKeyCache();
		clearHolidayCache();
	});

	it("returns empty array when ptoDays is 0", () => {
		expect(
			planAlternatives({
				...BASE,
				ptoDays: 0,
				maxAlternatives: 3,
				existingSuggestion: [makeDate({ year: 2025, month: 1, day: 6 })],
			}),
		).toHaveLength(0);
	});

	it("returns empty array when ptoDays is negative", () => {
		expect(
			planAlternatives({
				...BASE,
				ptoDays: -1,
				maxAlternatives: 3,
				existingSuggestion: [makeDate({ year: 2025, month: 1, day: 6 })],
			}),
		).toHaveLength(0);
	});

	it("returns empty array when maxAlternatives is 0", () => {
		expect(
			planAlternatives({
				...BASE,
				ptoDays: 3,
				maxAlternatives: 0,
				existingSuggestion: [makeDate({ year: 2025, month: 1, day: 6 })],
			}),
		).toHaveLength(0);
	});

	it("returns empty array when existingSuggestion is empty", () => {
		expect(planAlternatives({ ...BASE, ptoDays: 3, maxAlternatives: 3, existingSuggestion: [] })).toHaveLength(0);
	});

	it("returns at most maxAlternatives alternatives", () => {
		const result = planAlternatives({
			...BASE,
			ptoDays: 3,
			maxAlternatives: 2,
			existingSuggestion: [makeDate({ year: 2025, month: 1, day: 6 })],
		});
		expect(result.length).toBeLessThanOrEqual(2);
	});

	it("fills maxAlternatives on a full year that has bridges to spare", () => {
		const months = Array.from({ length: 12 }, (_, i) => makeDate({ year: 2025, month: i + 1, day: 1 }));
		const holidays = [
			makeDate({ year: 2025, month: 1, day: 1 }),
			makeDate({ year: 2025, month: 5, day: 1 }),
			makeDate({ year: 2025, month: 12, day: 25 }),
		].map(makeHoliday);
		const result = planAlternatives({
			...BASE,
			months,
			holidays,
			ptoDays: 10,
			maxAlternatives: 4,
			existingSuggestion: [makeDate({ year: 2025, month: 1, day: 3 })],
		});
		expect(result).toHaveLength(4);
	});

	it("keeps every Alternative at least MIN_DIFFERENCE away from the Suggestion and from each other", () => {
		const existingSuggestion = [
			makeDate({ year: 2025, month: 1, day: 3 }),
			makeDate({ year: 2025, month: 1, day: 10 }),
		];
		const result = planAlternatives({
			...BASE,
			months: FULL_YEAR,
			holidays: HOLIDAYS,
			ptoDays: 10,
			maxAlternatives: 4,
			existingSuggestion,
		});
		const plans = [existingSuggestion, ...result.map((alt) => alt.days)];

		expect(result.length).toBeGreaterThan(1);
		for (let i = 0; i < plans.length; i++) {
			for (let j = i + 1; j < plans.length; j++) {
				expect(planDistance({ plan: plans[i] ?? [], rival: plans[j] ?? [] })).toBeGreaterThanOrEqual(
					PTO_CONSTANTS.ALTERNATIVES.MIN_DIFFERENCE,
				);
			}
		}
	});

	it("may reuse a strong Bridge of the Suggestion, since distinct no longer means disjoint", () => {
		const existingSuggestion = [makeDate({ year: 2025, month: 1, day: 3 })];
		const result = planAlternatives({
			...BASE,
			months: FULL_YEAR,
			holidays: HOLIDAYS,
			ptoDays: 10,
			maxAlternatives: 4,
			existingSuggestion,
		});

		expect(
			result.some((alt) => alt.days.some((day) => day.toDateString() === existingSuggestion[0]?.toDateString())),
		).toBe(true);
	});

	it("all alternatives have distinct day sets", () => {
		const result = planAlternatives({
			...BASE,
			ptoDays: 5,
			maxAlternatives: 5,
			existingSuggestion: [makeDate({ year: 2025, month: 1, day: 6 })],
		});
		const keys = result.map((alt) =>
			alt.days
				.map((day) => day.toDateString())
				.sort()
				.join(","),
		);
		expect(keys.length).toBe(new Set(keys).size);
	});

	it("each alternative has days sorted chronologically even where its comparator picks a later Bridge first", () => {
		const result = planAlternatives({
			...BASE,
			months: Array.from({ length: 12 }, (_, index) => makeDate({ year: 2025, month: index + 1, day: 1 })),
			holidays: [
				makeDate({ year: 2025, month: 1, day: 1 }),
				makeDate({ year: 2025, month: 5, day: 1 }),
				makeDate({ year: 2025, month: 12, day: 25 }),
			].map(makeHoliday),
			ptoDays: 10,
			maxAlternatives: 3,
			existingSuggestion: [makeDate({ year: 2025, month: 1, day: 3 })],
		});

		expect(result).toHaveLength(3);
		for (const alt of result) {
			for (let i = 1; i < alt.days.length; i++) {
				expect(alt.days[i - 1].getTime()).toBeLessThanOrEqual(alt.days[i].getTime());
			}
		}
		expect(
			result.some((alt) => {
				const bridgeOrder = (alt.bridges ?? []).flatMap((bridge) => bridge.ptoDays);
				return bridgeOrder.map((day) => day.getTime()).join() !== alt.days.map((day) => day.getTime()).join();
			}),
		).toBe(true);
	});

	it("never places a Removed Day and does not let it lengthen a neighbouring bridge", () => {
		const removed = makeDate({ year: 2025, month: 1, day: 6 });
		const result = planAlternatives({
			...BASE,
			ptoDays: 5,
			maxAlternatives: 4,
			existingSuggestion: [makeDate({ year: 2025, month: 1, day: 10 })],
			removedDays: [removed],
		});
		expect(result.length).toBeGreaterThan(0);
		for (const alt of result) {
			expect(alt.days.some((day) => day.toDateString() === removed.toDateString())).toBe(false);
			for (const bridge of alt.bridges ?? []) {
				expect(bridge.startDate.getTime() <= removed.getTime() && removed.getTime() <= bridge.endDate.getTime()).toBe(
					false,
				);
			}
		}
	});

	it("stamps the chosen Strategy on every Alternative and offers the other Strategies' plans first", () => {
		const shared = {
			...BASE,
			months: FULL_YEAR,
			holidays: HOLIDAYS,
			ptoDays: 10,
			maxAlternatives: 4,
			existingSuggestion: [makeDate({ year: 2025, month: 1, day: 3 })],
		};
		const candidates = findPlanningCandidates({ holidays: HOLIDAYS, months: FULL_YEAR, allowPastDays: true });
		const planOf = (strategy: FilterStrategy) =>
			selectBridgesForStrategy({ bridges: candidates.bridges, targetPtoDays: 10, strategy }).days.map((day) =>
				day.toDateString(),
			);

		const balanced = planAlternatives({ ...shared, strategy: FilterStrategy.BALANCED });

		expect(balanced.map((alt) => alt.strategy)).toEqual(new Array(balanced.length).fill(FilterStrategy.BALANCED));
		expect(balanced[0]?.days.map((day) => day.toDateString())).toEqual(planOf(FilterStrategy.GROUPED));
		expect(balanced[1]?.days.map((day) => day.toDateString())).toEqual(planOf(FilterStrategy.OPTIMIZED));
	});

	it("returns no alternatives when no workdays are available (past months, allowPastDays=false)", () => {
		const result = planAlternatives({
			...BASE,
			ptoDays: 3,
			maxAlternatives: 3,
			allowPastDays: false,
			months: [makeDate({ year: 2020, month: 1, day: 1 })],
			existingSuggestion: [makeDate({ year: 2020, month: 1, day: 6 })],
		});
		expect(result).toHaveLength(0);
	});
});

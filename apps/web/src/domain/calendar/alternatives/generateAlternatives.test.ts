import type { HolidayDTO } from "@application/dto/holiday/types";
import { HolidayVariant } from "@application/dto/holiday/types";
import { beforeEach, describe, expect, it } from "vitest";
import { FilterStrategy } from "../types";
import { clearDateKeyCache, clearHolidayCache } from "../utils/cache";
import { findPlanningCandidates } from "../utils/candidates";
import { generateAlternatives } from "./generateAlternatives";

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

const makeDate = (year: number, month: number, day: number) => new Date(year, month - 1, day);

const makeHoliday = (date: Date) => ({
	id: `h-${date.toISOString()}`,
	date,
	name: "Test Holiday",
	variant: HolidayVariant.NATIONAL,
	isInSelectedRange: true,
});

const BASE = {
	holidays: [] as ReturnType<typeof makeHoliday>[],
	allowPastDays: true,
	months: [makeDate(2025, 1, 1)],
	strategy: FilterStrategy.GROUPED,
};

describe("generateAlternatives", () => {
	beforeEach(() => {
		clearDateKeyCache();
		clearHolidayCache();
	});

	it("returns empty array when ptoDays is 0", () => {
		expect(
			planAlternatives({ ...BASE, ptoDays: 0, maxAlternatives: 3, existingSuggestion: [makeDate(2025, 1, 6)] }),
		).toHaveLength(0);
	});

	it("returns empty array when ptoDays is negative", () => {
		expect(
			planAlternatives({ ...BASE, ptoDays: -1, maxAlternatives: 3, existingSuggestion: [makeDate(2025, 1, 6)] }),
		).toHaveLength(0);
	});

	it("returns empty array when maxAlternatives is 0", () => {
		expect(
			planAlternatives({ ...BASE, ptoDays: 3, maxAlternatives: 0, existingSuggestion: [makeDate(2025, 1, 6)] }),
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
			existingSuggestion: [makeDate(2025, 1, 6)],
		});
		expect(result.length).toBeLessThanOrEqual(2);
	});

	it("fills maxAlternatives on a full year that has bridges to spare", () => {
		const months = Array.from({ length: 12 }, (_, i) => makeDate(2025, i + 1, 1));
		const holidays = [makeDate(2025, 1, 1), makeDate(2025, 5, 1), makeDate(2025, 12, 25)].map(makeHoliday);
		const result = planAlternatives({
			...BASE,
			months,
			holidays,
			ptoDays: 10,
			maxAlternatives: 4,
			existingSuggestion: [makeDate(2025, 1, 3)],
		});
		expect(result).toHaveLength(4);
	});

	it("alternatives do not contain days from existingSuggestion", () => {
		const existingSuggestion = [makeDate(2025, 1, 6)];
		const existing = new Set(existingSuggestion.map((day) => day.toDateString()));
		const result = planAlternatives({
			...BASE,
			ptoDays: 3,
			maxAlternatives: 3,
			existingSuggestion,
		});
		for (const alt of result) {
			for (const day of alt.days) {
				expect(existing.has(day.toDateString())).toBe(false);
			}
		}
	});

	it("all alternatives have distinct day sets", () => {
		const result = planAlternatives({
			...BASE,
			ptoDays: 5,
			maxAlternatives: 5,
			existingSuggestion: [makeDate(2025, 1, 6)],
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
			months: Array.from({ length: 12 }, (_, index) => makeDate(2025, index + 1, 1)),
			holidays: [makeDate(2025, 1, 1), makeDate(2025, 5, 1), makeDate(2025, 12, 25)].map(makeHoliday),
			ptoDays: 10,
			maxAlternatives: 3,
			existingSuggestion: [makeDate(2025, 1, 3)],
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
		const removed = makeDate(2025, 1, 6);
		const result = planAlternatives({
			...BASE,
			ptoDays: 5,
			maxAlternatives: 4,
			existingSuggestion: [makeDate(2025, 1, 10)],
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

	it("stamps the Strategy on every Alternative but orders by the diversity comparators, not by it", () => {
		const shared = {
			...BASE,
			months: Array.from({ length: 12 }, (_, index) => makeDate(2025, index + 1, 1)),
			holidays: [makeDate(2025, 1, 1), makeDate(2025, 5, 1), makeDate(2025, 12, 25)].map(makeHoliday),
			ptoDays: 10,
			maxAlternatives: 4,
			existingSuggestion: [makeDate(2025, 1, 3)],
		};
		const daySets = (result: ReturnType<typeof planAlternatives>) =>
			result.map((alt) => alt.days.map((day) => day.toDateString()).join(","));

		const balanced = planAlternatives({ ...shared, strategy: FilterStrategy.BALANCED });
		const grouped = planAlternatives({ ...shared, strategy: FilterStrategy.GROUPED });

		expect(balanced).toHaveLength(4);
		expect(balanced.map((alt) => alt.strategy)).toEqual(new Array(4).fill(FilterStrategy.BALANCED));
		expect(daySets(balanced)).toEqual(daySets(grouped));
		expect(new Set(daySets(balanced)).size).toBe(4);
	});

	it("returns no alternatives when no workdays are available (past months, allowPastDays=false)", () => {
		const result = planAlternatives({
			...BASE,
			ptoDays: 3,
			maxAlternatives: 3,
			allowPastDays: false,
			months: [makeDate(2020, 1, 1)],
			existingSuggestion: [makeDate(2020, 1, 6)],
		});
		expect(result).toHaveLength(0);
	});
});

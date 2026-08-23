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
	isInSelectedRange: true,
});

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

	it("alternatives do not contain days from existingSuggestion", () => {
		const existingSuggestion = [makeDate({ year: 2025, month: 1, day: 6 })];
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

	it("each alternative has days sorted chronologically", () => {
		const result = planAlternatives({
			...BASE,
			ptoDays: 5,
			maxAlternatives: 3,
			existingSuggestion: [makeDate({ year: 2025, month: 1, day: 6 })],
		});
		for (const alt of result) {
			for (let i = 1; i < alt.days.length; i++) {
				expect(alt.days[i - 1].getTime()).toBeLessThanOrEqual(alt.days[i].getTime());
			}
		}
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

	it("works with BALANCED strategy", () => {
		const result = planAlternatives({
			...BASE,
			strategy: FilterStrategy.BALANCED,
			ptoDays: 3,
			maxAlternatives: 2,
			existingSuggestion: [makeDate({ year: 2025, month: 1, day: 6 })],
		});
		expect(Array.isArray(result)).toBe(true);
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

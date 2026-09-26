import type { HolidayDTO } from "@application/dto/holiday/types";
import { HolidayVariant } from "@application/dto/holiday/types";
import { beforeEach, describe, expect, it } from "vitest";
import { PTO_CONSTANTS } from "../const";
import { selectBridgesForStrategy } from "../suggestions/utils/selectors";
import { FilterStrategy, type Suggestion } from "../types";
import { clearDateKeyCache, clearHolidayCache } from "../utils/cache";
import { findPlanningCandidates } from "../utils/candidates";
import { generateAlternatives } from "./generateAlternatives";
import { coveredDays, planDistance } from "./utils/helpers";

interface PlanAlternativesParams {
	ptoDays: number;
	holidays: HolidayDTO[];
	allowPastDays: boolean;
	months: Date[];
	strategy: FilterStrategy;
	removedDays?: Date[];
	maxAlternatives: number;
	existingSuggestion?: Pick<Suggestion, "days" | "bridges">;
}

const planAlternatives = ({
	ptoDays,
	holidays,
	allowPastDays,
	months,
	strategy,
	removedDays,
	maxAlternatives,
	existingSuggestion,
}: PlanAlternativesParams) => {
	const candidates = findPlanningCandidates({ holidays, months, allowPastDays, removedDays });
	const suggestion =
		existingSuggestion ?? selectBridgesForStrategy({ bridges: candidates.bridges, targetPtoDays: ptoDays, strategy });

	return {
		suggestion,
		candidates,
		alternatives: generateAlternatives({
			ptoDays,
			strategy,
			maxAlternatives,
			existingSuggestion: suggestion,
			candidates,
		}),
	};
};

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

const YEAR = { ...BASE, months: FULL_YEAR, holidays: HOLIDAYS, ptoDays: 10, maxAlternatives: 4 };

const toStrings = (days: Date[]) => days.map((day) => day.toDateString());

describe("generateAlternatives", () => {
	beforeEach(() => {
		clearDateKeyCache();
		clearHolidayCache();
	});

	it("returns empty array when ptoDays is 0", () => {
		expect(planAlternatives({ ...BASE, ptoDays: 0, maxAlternatives: 3 }).alternatives).toHaveLength(0);
	});

	it("returns empty array when ptoDays is negative", () => {
		expect(planAlternatives({ ...BASE, ptoDays: -1, maxAlternatives: 3 }).alternatives).toHaveLength(0);
	});

	it("returns empty array when maxAlternatives is 0", () => {
		expect(planAlternatives({ ...BASE, ptoDays: 3, maxAlternatives: 0 }).alternatives).toHaveLength(0);
	});

	it("returns empty array when the Suggestion placed nothing", () => {
		expect(
			planAlternatives({ ...BASE, ptoDays: 3, maxAlternatives: 3, existingSuggestion: { days: [] } }).alternatives,
		).toHaveLength(0);
	});

	it("returns at most maxAlternatives alternatives", () => {
		expect(planAlternatives({ ...BASE, ptoDays: 3, maxAlternatives: 2 }).alternatives.length).toBeLessThanOrEqual(2);
	});

	it.each(Object.values(FilterStrategy))(
		"%s: fills maxAlternatives on a full year that has bridges to spare",
		(strategy) => {
			expect(planAlternatives({ ...YEAR, strategy }).alternatives).toHaveLength(4);
		},
	);

	it.each(Object.values(FilterStrategy))(
		"%s: never offers a plan that covers more days than the Suggestion, or returns more per PTO Day",
		(strategy) => {
			const { suggestion, alternatives } = planAlternatives({ ...YEAR, strategy });
			const ceiling = coveredDays(suggestion);

			expect(alternatives.length).toBeGreaterThan(0);
			for (const alternative of alternatives) {
				const covered = coveredDays(alternative);
				expect(covered).toBeLessThanOrEqual(ceiling);
				expect(covered / alternative.days.length).toBeLessThanOrEqual(ceiling / suggestion.days.length);
			}
		},
	);

	it("offers another Strategy's plan only when it covers fewer days than the Suggestion", () => {
		const { candidates, alternatives } = planAlternatives({ ...YEAR, strategy: FilterStrategy.OPTIMIZED });
		const planOf = (strategy: FilterStrategy) =>
			selectBridgesForStrategy({ bridges: candidates.bridges, targetPtoDays: YEAR.ptoDays, strategy });
		const offered = alternatives.map((alternative) => toStrings(alternative.days).join());

		expect(offered).toContain(toStrings(planOf(FilterStrategy.GROUPED).days).join());
		expect(
			planAlternatives({ ...YEAR, strategy: FilterStrategy.GROUPED }).alternatives.map((alternative) =>
				toStrings(alternative.days).join(),
			),
		).not.toContain(toStrings(planOf(FilterStrategy.OPTIMIZED).days).join());
	});

	it("keeps every Alternative at least MIN_DIFFERENCE away from the Suggestion and from each other", () => {
		const { suggestion, alternatives } = planAlternatives({ ...YEAR, strategy: FilterStrategy.OPTIMIZED });
		const plans = [suggestion.days, ...alternatives.map((alt) => alt.days)];

		expect(alternatives.length).toBeGreaterThan(1);
		for (let i = 0; i < plans.length; i++) {
			for (let j = i + 1; j < plans.length; j++) {
				expect(planDistance({ plan: plans[i] ?? [], rival: plans[j] ?? [] })).toBeGreaterThanOrEqual(
					PTO_CONSTANTS.ALTERNATIVES.MIN_DIFFERENCE,
				);
			}
		}
	});

	it("may reuse a Bridge of the Suggestion, since distinct no longer means disjoint", () => {
		const { suggestion, alternatives } = planAlternatives({ ...YEAR, strategy: FilterStrategy.OPTIMIZED });
		const placed = new Set(toStrings(suggestion.days));

		expect(alternatives.some((alt) => alt.days.some((day) => placed.has(day.toDateString())))).toBe(true);
	});

	it("each alternative has days sorted chronologically even where it took a later Bridge first", () => {
		const { alternatives } = planAlternatives({ ...YEAR, strategy: FilterStrategy.OPTIMIZED, maxAlternatives: 3 });

		expect(alternatives).toHaveLength(3);
		for (const alt of alternatives) {
			for (let i = 1; i < alt.days.length; i++) {
				expect(alt.days[i - 1].getTime()).toBeLessThanOrEqual(alt.days[i].getTime());
			}
		}
		expect(
			alternatives.some((alt) => {
				const bridgeOrder = (alt.bridges ?? []).flatMap((bridge) => bridge.ptoDays);
				return bridgeOrder.map((day) => day.getTime()).join() !== alt.days.map((day) => day.getTime()).join();
			}),
		).toBe(true);
	});

	it("never places a Removed Day and does not let it lengthen a neighbouring bridge", () => {
		const removed = makeDate({ year: 2025, month: 1, day: 6 });
		const { alternatives } = planAlternatives({
			...YEAR,
			strategy: FilterStrategy.OPTIMIZED,
			removedDays: [removed],
		});

		expect(alternatives.length).toBeGreaterThan(0);
		for (const alt of alternatives) {
			expect(alt.days.some((day) => day.toDateString() === removed.toDateString())).toBe(false);
			for (const bridge of alt.bridges ?? []) {
				expect(bridge.startDate.getTime() <= removed.getTime() && removed.getTime() <= bridge.endDate.getTime()).toBe(
					false,
				);
			}
		}
	});

	it("stamps each Alternative with the Strategy that found it", () => {
		const { candidates, alternatives } = planAlternatives({ ...YEAR, strategy: FilterStrategy.OPTIMIZED });
		const groupedPlan = toStrings(
			selectBridgesForStrategy({
				bridges: candidates.bridges,
				targetPtoDays: YEAR.ptoDays,
				strategy: FilterStrategy.GROUPED,
			}).days,
		).join();

		expect(alternatives.find((alt) => toStrings(alt.days).join() === groupedPlan)?.strategy).toBe(
			FilterStrategy.GROUPED,
		);
		expect(alternatives.at(-1)?.strategy).toBe(FilterStrategy.OPTIMIZED);
	});

	it("returns no alternatives when no workdays are available (past months, allowPastDays=false)", () => {
		const { alternatives } = planAlternatives({
			...BASE,
			ptoDays: 3,
			maxAlternatives: 3,
			allowPastDays: false,
			months: [makeDate({ year: 2020, month: 1, day: 1 })],
			existingSuggestion: { days: [makeDate({ year: 2020, month: 1, day: 6 })] },
		});
		expect(alternatives).toHaveLength(0);
	});
});

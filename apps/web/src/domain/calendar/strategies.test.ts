import { HolidayVariant } from "@application/dto/holiday/types";
import { dayIndex } from "@application/shared/utils/dates";
import { describe, expect, it } from "vitest";
import { planDistance } from "./alternatives/utils/helpers";
import { PTO_CONSTANTS } from "./const";
import { runPlanningPipeline } from "./pipeline";
import { FilterStrategy, type MeasuredSuggestion } from "./types";

const SPAIN_2026 = [
	new Date(2026, 0, 1),
	new Date(2026, 0, 6),
	new Date(2026, 3, 2),
	new Date(2026, 3, 3),
	new Date(2026, 4, 1),
	new Date(2026, 7, 15),
	new Date(2026, 9, 12),
	new Date(2026, 10, 1),
	new Date(2026, 11, 6),
	new Date(2026, 11, 8),
	new Date(2026, 11, 25),
	new Date(2027, 0, 1),
	new Date(2027, 0, 6),
].map((date, index) => ({
	id: `es-${index}`,
	date,
	name: "Holiday",
	variant: HolidayVariant.NATIONAL,
	isInPlanningWindow: true,
}));

const BUDGET = 22;

const plan = (strategy: FilterStrategy) =>
	runPlanningPipeline({
		window: { year: 2026, carryOverMonths: 0 },
		ptoDays: BUDGET,
		holidays: SPAIN_2026,
		manuallySelectedDays: [],
		removedSuggestedDays: [],
		allowPastDays: true,
		strategy,
		locale: "en",
		maxAlternatives: 4,
	});

const PLANS = Object.fromEntries(Object.values(FilterStrategy).map((strategy) => [strategy, plan(strategy)])) as Record<
	FilterStrategy,
	ReturnType<typeof plan>
>;

const suggestionOf = (strategy: FilterStrategy) => PLANS[strategy].suggestion;

const spanUnion = ({ bridges = [] }: MeasuredSuggestion) => {
	const covered = new Set<number>();
	for (const bridge of bridges) {
		for (let day = dayIndex(bridge.startDate); day <= dayIndex(bridge.endDate); day++) covered.add(day);
	}
	return covered.size;
};

describe("the Strategies over a real calendar", () => {
	it.each(Object.values(FilterStrategy))("%s spends the whole budget", (strategy) => {
		expect(suggestionOf(strategy).days).toHaveLength(BUDGET);
	});

	it.each(Object.values(FilterStrategy))(
		"%s: what the selector believed it gained is what the Metrics measure, so nothing was counted twice",
		(strategy) => {
			const suggestion = suggestionOf(strategy);

			expect(spanUnion(suggestion)).toBe(suggestion.metrics.totalEffectiveDays);
		},
	);

	it.each([
		[FilterStrategy.OPTIMIZED, PTO_CONSTANTS.EFFICIENCY.MINIMUM],
		[FilterStrategy.BALANCED, PTO_CONSTANTS.EFFICIENCY.MINIMUM],
		[FilterStrategy.GROUPED, PTO_CONSTANTS.EFFICIENCY.BLOCK_MINIMUM],
	])("%s never lands under its own floor of %s", (strategy, floor) => {
		expect(suggestionOf(strategy).metrics.averageEfficiency).toBeGreaterThanOrEqual(floor);
	});

	it("orders the Strategies along one axis: Effective Days one way, the longest break the other", () => {
		const { OPTIMIZED, BALANCED, GROUPED } = FilterStrategy;
		const effective = (strategy: FilterStrategy) => suggestionOf(strategy).metrics.totalEffectiveDays;
		const longest = (strategy: FilterStrategy) => suggestionOf(strategy).metrics.longestVacation;

		expect(effective(OPTIMIZED)).toBeGreaterThan(effective(BALANCED));
		expect(effective(BALANCED)).toBeGreaterThan(effective(GROUPED));
		expect(longest(GROUPED)).toBeGreaterThan(longest(BALANCED));
		expect(longest(BALANCED)).toBeGreaterThan(longest(OPTIMIZED));
	});

	it("keeps GROUPED's blocks within GROUPED_MAX_BLOCK_DAYS", () => {
		expect(suggestionOf(FilterStrategy.GROUPED).metrics.longestVacation).toBeLessThanOrEqual(
			PTO_CONSTANTS.SELECTION.GROUPED_MAX_BLOCK_DAYS,
		);
	});

	it("does not pile OPTIMIZED's ties into the first weeks of the year", () => {
		expect(Math.max(...suggestionOf(FilterStrategy.OPTIMIZED).metrics.monthlyDist)).toBeLessThanOrEqual(3);
	});

	it("gives BALANCED a break in every quarter", () => {
		expect(suggestionOf(FilterStrategy.BALANCED).metrics.quarterDist.every((count) => count > 0)).toBe(true);
	});

	it.each(Object.values(FilterStrategy))(
		"%s offers four Alternatives, each distinct from every other plan",
		(strategy) => {
			const { suggestion, alternatives } = PLANS[strategy];
			const plans = [suggestion, ...alternatives].map(({ days }) => days);

			expect(alternatives).toHaveLength(4);
			for (let i = 0; i < plans.length; i++) {
				for (let j = i + 1; j < plans.length; j++) {
					expect(planDistance({ plan: plans[i] ?? [], rival: plans[j] ?? [] })).toBeGreaterThanOrEqual(
						PTO_CONSTANTS.ALTERNATIVES.MIN_DIFFERENCE,
					);
				}
			}
		},
	);
});

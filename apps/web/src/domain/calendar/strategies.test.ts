import { HolidayVariant } from "@application/dto/holiday/types";
import { describe, expect, it } from "vitest";
import { planDistance } from "./alternatives/utils/helpers";
import { PTO_CONSTANTS } from "./const";
import { runPlanningPipeline } from "./pipeline";
import { type MeasuredSuggestion, Strategy } from "./types";
import { measurePlan } from "./utils/measures";

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
const SUMMER = [6, 7];

interface PlanParams {
	strategy: Strategy;
	carryOverMonths?: number;
	maxAlternatives?: number;
}

const plan = ({ strategy, carryOverMonths = 0, maxAlternatives = 4 }: PlanParams) =>
	runPlanningPipeline({
		window: { year: 2026, carryOverMonths },
		ptoDays: BUDGET,
		holidays: SPAIN_2026,
		manualDays: [],
		removedSuggestedDays: [],
		allowPastDays: true,
		strategy,
		preferredMonths: SUMMER,
		locale: "en",
		maxAlternatives,
	});

const PLANS = Object.fromEntries(Object.values(Strategy).map((strategy) => [strategy, plan({ strategy })])) as Record<
	Strategy,
	ReturnType<typeof plan>
>;

const suggestionOf = (strategy: Strategy) => PLANS[strategy].suggestion;

const spanUnion = (plan: MeasuredSuggestion) =>
	measurePlan({ plan, alreadyOff: [], manualDays: [], workdays: [], preferredMonths: [] }).covered;

describe("the Strategies over a real calendar", () => {
	it.each(Object.values(Strategy))(
		"%s chooses the same Suggestion however many Alternatives are asked for",
		(strategy) => {
			const days = (maxAlternatives: number) =>
				plan({ strategy, carryOverMonths: 1, maxAlternatives })
					.suggestion.days.map((day) => day.toDateString())
					.join();

			expect(days(0)).toBe(days(4));
			expect(days(1)).toBe(days(4));
		},
	);

	it.each(Object.values(Strategy))("%s spends the whole budget", (strategy) => {
		expect(suggestionOf(strategy).days).toHaveLength(BUDGET);
	});

	it.each(Object.values(Strategy))(
		"%s: what the selector believed it gained is what the Metrics measure, so nothing was counted twice",
		(strategy) => {
			const suggestion = suggestionOf(strategy);

			expect(spanUnion(suggestion)).toBe(suggestion.metrics.totalEffectiveDays);
		},
	);

	it.each([
		[Strategy.OPTIMIZED, PTO_CONSTANTS.EFFICIENCY.MINIMUM],
		[Strategy.BALANCED, PTO_CONSTANTS.EFFICIENCY.MINIMUM],
		[Strategy.GROUPED, PTO_CONSTANTS.EFFICIENCY.BLOCK_MINIMUM],
		[Strategy.MAIN_VACATION, PTO_CONSTANTS.EFFICIENCY.BLOCK_MINIMUM],
	])("%s never lands under its own floor of %s", (strategy, floor) => {
		expect(suggestionOf(strategy).metrics.averageEfficiency).toBeGreaterThanOrEqual(floor);
	});

	it("orders Effective Days from OPTIMIZED through BALANCED to GROUPED, and gives GROUPED the Longest Vacation", () => {
		const { OPTIMIZED, BALANCED, GROUPED } = Strategy;
		const effective = (strategy: Strategy) => suggestionOf(strategy).metrics.totalEffectiveDays;
		const longest = (strategy: Strategy) => suggestionOf(strategy).metrics.longestVacation;

		expect(effective(OPTIMIZED)).toBeGreaterThan(effective(BALANCED));
		expect(effective(BALANCED)).toBeGreaterThan(effective(GROUPED));
		expect(longest(GROUPED)).toBeGreaterThan(longest(OPTIMIZED));
	});

	it("leaves BALANCED the shortest stretch of work of every Strategy", () => {
		const balanced = suggestionOf(Strategy.BALANCED).metrics.maxWorkStreak;

		for (const strategy of Object.values(Strategy)) {
			expect(balanced).toBeLessThanOrEqual(suggestionOf(strategy).metrics.maxWorkStreak);
		}
		expect(balanced).toBeLessThan(suggestionOf(Strategy.GROUPED).metrics.maxWorkStreak);
	});

	it("gives MAIN_VACATION its summer block first, then spends the rest like OPTIMIZED", () => {
		const { bridges = [], metrics } = suggestionOf(Strategy.MAIN_VACATION);
		const [block] = bridges;

		expect(block?.ptoDays.every((day) => SUMMER.includes(day.getMonth()))).toBe(true);
		expect(metrics.longestVacation).toBeGreaterThan(suggestionOf(Strategy.OPTIMIZED).metrics.longestVacation);
		expect(metrics.longestVacation).toBeLessThanOrEqual(PTO_CONSTANTS.SELECTION.MAIN_VACATION_BLOCK_DAYS);
		expect(metrics.totalEffectiveDays).toBeGreaterThan(suggestionOf(Strategy.GROUPED).metrics.totalEffectiveDays);
	});

	it("keeps GROUPED's blocks within GROUPED_MAX_BLOCK_DAYS", () => {
		expect(suggestionOf(Strategy.GROUPED).metrics.longestVacation).toBeLessThanOrEqual(
			PTO_CONSTANTS.SELECTION.GROUPED_MAX_BLOCK_DAYS,
		);
	});

	it("does not pile OPTIMIZED's ties into the first weeks of the year", () => {
		expect(Math.max(...suggestionOf(Strategy.OPTIMIZED).metrics.monthlyDist)).toBeLessThanOrEqual(3);
	});

	it.each(Object.values(Strategy))(
		"%s offers no Alternative with more Effective Days or more Efficiency than the Suggestion",
		(strategy) => {
			const { suggestion, alternatives } = PLANS[strategy];

			for (const { metrics } of alternatives) {
				expect(metrics.totalEffectiveDays).toBeLessThanOrEqual(suggestion.metrics.totalEffectiveDays);
				expect(metrics.averageEfficiency).toBeLessThanOrEqual(suggestion.metrics.averageEfficiency);
			}
		},
	);

	it.each(Object.values(Strategy))("%s offers four Alternatives, each distinct from every other plan", (strategy) => {
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
	});

	it.each(Object.values(Strategy))(
		"%s keeps four Alternatives, none ahead of the Suggestion, when Manual Days are placed",
		(strategy) => {
			const { suggestion, alternatives } = runPlanningPipeline({
				window: { year: 2026, carryOverMonths: 0 },
				ptoDays: BUDGET,
				holidays: SPAIN_2026,
				manualDays: [new Date(2026, 0, 9), new Date(2026, 2, 9), new Date(2026, 5, 22)],
				removedSuggestedDays: [],
				allowPastDays: true,
				strategy,
				preferredMonths: SUMMER,
				locale: "en",
				maxAlternatives: 4,
			});

			expect(alternatives).toHaveLength(4);
			for (const { metrics } of alternatives) {
				expect(metrics.totalEffectiveDays).toBeLessThanOrEqual(suggestion.metrics.totalEffectiveDays);
				expect(metrics.averageEfficiency).toBeLessThanOrEqual(suggestion.metrics.averageEfficiency);
			}
		},
	);
});

import { type HolidayDTO, HolidayVariant } from "@application/dto/holiday/types";
import { describe, expect, it, vi } from "vitest";
import { runPlanningPipeline } from "./pipeline";
import { FilterStrategy } from "./types";

const YEAR = 2025;

const holiday = (id: string, date: Date): HolidayDTO => ({
	id,
	date,
	name: id,
	variant: HolidayVariant.NATIONAL,
	isInSelectedRange: true,
});

const baseInput = {
	window: { year: YEAR, carryOverMonths: 0 },
	ptoDays: 5,
	holidays: [holiday("new-year", new Date(YEAR, 0, 1)), holiday("epiphany", new Date(YEAR, 0, 6))],
	allowPastDays: true,
	strategy: FilterStrategy.GROUPED,
	locale: "en" as const,
	maxAlternatives: 2,
};

describe("runPlanningPipeline", () => {
	it("plans a Suggestion and measures it in one call", () => {
		const result = runPlanningPipeline(baseInput);

		expect(result.planned).toBe(true);
		expect(result.suggestion.days.length).toBeGreaterThan(0);
		expect(result.suggestion.metrics).toBeDefined();
		expect(result.alternatives.every((alternative) => alternative.metrics !== undefined)).toBe(true);
	});

	it("takes Manual Days out of the budget and plans around them", () => {
		const manual = [new Date(YEAR, 6, 7), new Date(YEAR, 6, 8)];

		const result = runPlanningPipeline({ ...baseInput, ptoDays: 5, manuallySelectedDays: manual });

		expect(result.suggestion.days.length).toBeLessThanOrEqual(3);
		expect(result.suggestion.days.some((day) => day.getTime() === manual[0].getTime())).toBe(false);
	});

	it("blocks each Manual Day as a CUSTOM pseudo-Holiday, so the engine cannot re-suggest a day already paid for", async () => {
		const candidates = await import("./utils/candidates");
		const findPlanningCandidates = vi.spyOn(candidates, "findPlanningCandidates").mockClear();
		const manual = new Date(YEAR, 6, 7);
		const removed = new Date(YEAR, 6, 21);

		runPlanningPipeline({ ...baseInput, manuallySelectedDays: [manual], removedSuggestedDays: [removed] });

		const [args] = findPlanningCandidates.mock.lastCall ?? [];
		expect(args?.holidays.map(({ id }) => id)).toEqual(["new-year", "epiphany", "manual-0"]);
		expect(args?.holidays.at(-1)).toEqual({
			id: "manual-0",
			date: manual,
			name: "Manual day",
			variant: HolidayVariant.CUSTOM,
			isInSelectedRange: true,
		});
		expect(args?.removedDays).toEqual([removed]);
		expect(args?.holidays.some(({ date }) => date.getTime() === removed.getTime())).toBe(false);
		findPlanningCandidates.mockRestore();
	});

	it("lets autoSuggestCount win over the budget it would otherwise derive", async () => {
		const suggestions = await import("./suggestions/generateSuggestions");
		const alternatives = await import("./alternatives/generateAlternatives");
		const generateSuggestions = vi.spyOn(suggestions, "generateSuggestions").mockClear();
		const generateAlternatives = vi.spyOn(alternatives, "generateAlternatives").mockClear();

		runPlanningPipeline({
			...baseInput,
			ptoDays: 10,
			manuallySelectedDays: [new Date(YEAR, 6, 7)],
			autoSuggestCount: 2,
		});

		expect(generateSuggestions.mock.lastCall?.[0].ptoDays).toBe(2);
		expect(generateAlternatives.mock.lastCall?.[0].ptoDays).toBe(2);
		generateSuggestions.mockRestore();
		generateAlternatives.mockRestore();
	});

	it("measures every Suggestion with the Manual Days, not only the days it placed itself", async () => {
		const metrics = await import("./metrics/generateMetrics");
		const generateMetrics = vi.spyOn(metrics, "generateMetrics").mockClear();
		const manual = new Date(YEAR, 6, 7);
		const removed = new Date(YEAR, 6, 21);

		const result = runPlanningPipeline({
			...baseInput,
			manuallySelectedDays: [manual],
			removedSuggestedDays: [removed],
		});

		expect(generateMetrics.mock.calls).toHaveLength(1 + result.alternatives.length);
		for (const [args] of generateMetrics.mock.calls) {
			expect(args.manuallySelectedDays).toEqual([manual]);
			expect(args.removedSuggestedDays).toEqual([removed]);
			expect(args.holidays.some(({ id }) => id === "manual-0")).toBe(true);
			expect(args.holidays.some(({ date }) => date.getTime() === removed.getTime())).toBe(false);
		}
		generateMetrics.mockRestore();
	});

	it("measures every Suggestion against the Planning Window it was given, Alternatives included", async () => {
		const metrics = await import("./metrics/generateMetrics");
		const generateMetrics = vi.spyOn(metrics, "generateMetrics").mockClear();
		const window = { year: YEAR, carryOverMonths: 2 };

		const result = runPlanningPipeline({ ...baseInput, window });

		expect(result.alternatives.length).toBeGreaterThan(0);
		expect(generateMetrics.mock.calls).toHaveLength(1 + result.alternatives.length);
		for (const [args] of generateMetrics.mock.calls) expect(args.planningWindow).toEqual(window);
		generateMetrics.mockRestore();
	});

	describe("the empty result", () => {
		it("reports it did not plan, rather than an empty plan that looks calculated", () => {
			const result = runPlanningPipeline({ ...baseInput, ptoDays: 0 });

			expect(result.planned).toBe(false);
			expect(result.suggestion.days).toEqual([]);
			expect(result.alternatives).toEqual([]);
		});

		it("carries Metrics measured by the engine, never absent", () => {
			const { suggestion } = runPlanningPipeline({ ...baseInput, ptoDays: 0 });

			expect(suggestion.metrics).toBeDefined();
			expect(suggestion.metrics.averageEfficiency).toBe(0);
			expect(suggestion.metrics.totalEffectiveDays).toBe(0);
			expect(suggestion.metrics.firstLastBreak).toBeNull();
		});

		it("sizes those Metrics to the Planning Window, not to a hard-coded twelve months", () => {
			const { suggestion } = runPlanningPipeline({
				...baseInput,
				ptoDays: 0,
				window: { year: YEAR, carryOverMonths: 3 },
			});

			expect(suggestion.metrics.monthlyDist).toHaveLength(15);
			expect(suggestion.metrics.monthlyDist.every((count) => count === 0)).toBe(true);
		});

		it("refuses to plan when there is nothing free to bridge", () => {
			expect(runPlanningPipeline({ ...baseInput, holidays: [] }).planned).toBe(false);
		});

		it("refuses to plan when the only blocked dates are Removed Days, which never become Holidays", () => {
			const result = runPlanningPipeline({
				...baseInput,
				holidays: [],
				removedSuggestedDays: [new Date(YEAR, 3, 20)],
			});

			expect(result.planned).toBe(false);
			expect(result.suggestion.days).toEqual([]);
			expect(result.alternatives).toEqual([]);
		});

		it("refuses to plan when the Manual Days have consumed the whole budget", () => {
			const result = runPlanningPipeline({
				...baseInput,
				ptoDays: 2,
				manuallySelectedDays: [new Date(YEAR, 2, 5), new Date(YEAR, 2, 6), new Date(YEAR, 2, 7)],
			});

			expect(result.planned).toBe(false);
			expect(result.suggestion.days).toEqual([]);
			expect(result.alternatives).toEqual([]);
		});
	});

	it("clears the calculation caches itself, so a second run sees its own Holidays", () => {
		const first = runPlanningPipeline(baseInput);

		const second = runPlanningPipeline({
			...baseInput,
			holidays: [holiday("assumption", new Date(YEAR, 7, 15)), holiday("all-saints", new Date(YEAR, 10, 1))],
		});

		const firstMonths = new Set(first.suggestion.days.map((day) => day.getMonth()));
		const secondMonths = new Set(second.suggestion.days.map((day) => day.getMonth()));

		expect(second.planned).toBe(true);
		expect([...secondMonths].some((month) => !firstMonths.has(month))).toBe(true);
	});

	it("finds the Bridges once per run, not once per generator", async () => {
		const helpers = await import("./utils/helpers");
		const findBridges = vi.spyOn(helpers, "findBridges");

		runPlanningPipeline(baseInput);

		expect(findBridges).toHaveBeenCalledTimes(1);
		findBridges.mockRestore();
	});
});

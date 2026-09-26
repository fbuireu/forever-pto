import { type HolidayDTO, HolidayVariant } from "@application/dto/holiday/types";
import { startOfToday } from "@application/shared/utils/dates";
import type { Locale } from "next-intl";
import { generateAlternatives } from "./alternatives/generateAlternatives";
import { generateMetrics } from "./metrics/generateMetrics";
import { generateSuggestions } from "./suggestions/generateSuggestions";
import type { FilterStrategy, MeasuredSuggestion, Suggestion } from "./types";
import { measureBudget } from "./utils/budget";
import { clearDateKeyCache, clearHolidayCache } from "./utils/cache";
import { findPlanningCandidates } from "./utils/candidates";
import { type PlanningWindow, planningWindowMonths, reachableMonths, reachablePreferredMonths } from "./window";

export interface PlanningInput {
	window: PlanningWindow;
	ptoDays: number;
	autoSuggestCount?: number;
	holidays: HolidayDTO[];
	manuallySelectedDays?: Date[];
	removedSuggestedDays?: Date[];
	allowPastDays: boolean;
	strategy: FilterStrategy;
	preferredMonths?: number[];
	locale: Locale;
	maxAlternatives: number;
}

export type PlanningResult =
	| { planned: true; suggestion: MeasuredSuggestion; alternatives: MeasuredSuggestion[] }
	| { planned: false; suggestion: MeasuredSuggestion; alternatives: [] };

const MANUAL_DAY_NAME = "Manual day";

export function runPlanningPipeline({
	window,
	ptoDays,
	autoSuggestCount,
	holidays,
	manuallySelectedDays = [],
	removedSuggestedDays = [],
	allowPastDays,
	strategy,
	preferredMonths: requestedMonths = [],
	locale,
	maxAlternatives,
}: PlanningInput): PlanningResult {
	clearDateKeyCache();
	clearHolidayCache();

	const months = planningWindowMonths(window);
	const preferredMonths = reachablePreferredMonths({
		preferredMonths: requestedMonths,
		reachable: reachableMonths({ ...window, allowPastDays, today: startOfToday() }),
	});
	const manualPseudoHolidays: HolidayDTO[] = manuallySelectedDays.map((date, index) => ({
		id: `manual-${index}`,
		date,
		name: MANUAL_DAY_NAME,
		variant: HolidayVariant.CUSTOM,
		isInPlanningWindow: true,
	}));
	const holidaysWithManual = [...holidays, ...manualPseudoHolidays];
	const effectivePtoDays = autoSuggestCount ?? measureBudget({ ptoDays, manuallySelectedDays }).remaining;

	const measure = (suggestion: Suggestion): MeasuredSuggestion => ({
		...suggestion,
		metrics: generateMetrics({
			suggestion,
			locale,
			planningWindow: window,
			holidays: holidaysWithManual,
			allowPastDays,
			manuallySelectedDays,
			removedSuggestedDays,
		}),
	});

	const unplanned = (): PlanningResult => ({
		planned: false,
		suggestion: measure({ days: [], bridges: [], strategy }),
		alternatives: [],
	});

	if (effectivePtoDays <= 0) return unplanned();

	const candidates = findPlanningCandidates({
		holidays: holidaysWithManual,
		months,
		allowPastDays,
		removedDays: removedSuggestedDays,
		manualDays: manuallySelectedDays,
	});

	if (candidates.bridges.length === 0) return unplanned();

	const baseSuggestion = generateSuggestions({ ptoDays: effectivePtoDays, candidates, strategy, preferredMonths });

	const { suggestion, alternatives } = generateAlternatives({
		ptoDays: effectivePtoDays,
		candidates,
		maxAlternatives,
		existingSuggestion: baseSuggestion,
		strategy,
		preferredMonths,
	});

	return {
		planned: true,
		suggestion: measure(suggestion),
		alternatives: alternatives.map(measure),
	};
}

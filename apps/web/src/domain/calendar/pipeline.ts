import { type HolidayDTO, HolidayVariant } from "@application/dto/holiday/types";
import type { Locale } from "next-intl";
import { generateAlternatives } from "./alternatives/generateAlternatives";
import { generateMetrics } from "./metrics/generateMetrics";
import { generateSuggestions } from "./suggestions/generateSuggestions";
import type { FilterStrategy, MeasuredSuggestion, Suggestion } from "./types";
import { clearDateKeyCache, clearHolidayCache } from "./utils/cache";
import { findPlanningCandidates } from "./utils/candidates";
import { type PlanningWindow, planningWindowMonths } from "./window";

export interface PlanningInput {
	window: PlanningWindow;
	ptoDays: number;
	autoSuggestCount?: number;
	holidays: HolidayDTO[];
	manuallySelectedDays?: Date[];
	removedSuggestedDays?: Date[];
	allowPastDays: boolean;
	strategy: FilterStrategy;
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
	locale,
	maxAlternatives,
}: PlanningInput): PlanningResult {
	clearDateKeyCache();
	clearHolidayCache();

	const months = planningWindowMonths(window);
	const manualPseudoHolidays: HolidayDTO[] = manuallySelectedDays.map((date, index) => ({
		id: `manual-${index}`,
		date,
		name: MANUAL_DAY_NAME,
		variant: HolidayVariant.CUSTOM,
		isInSelectedRange: true,
	}));
	const holidaysWithManual = [...holidays, ...manualPseudoHolidays];
	const effectivePtoDays = Math.max(0, autoSuggestCount ?? ptoDays - manuallySelectedDays.length);

	const measure = (suggestion: Suggestion): MeasuredSuggestion => ({
		...suggestion,
		metrics: generateMetrics({
			suggestion,
			locale,
			year: window.year,
			bridges: suggestion.bridges,
			holidays: holidaysWithManual,
			allowPastDays,
			manuallySelectedDays,
			removedSuggestedDays,
			carryOverMonths: window.carryOverMonths,
		}),
	});

	if (effectivePtoDays <= 0 || holidaysWithManual.length === 0) {
		return { planned: false, suggestion: measure({ days: [], bridges: [], strategy }), alternatives: [] };
	}

	const candidates = findPlanningCandidates({
		holidays: holidaysWithManual,
		months,
		allowPastDays,
		removedDays: removedSuggestedDays,
	});

	const baseSuggestion = generateSuggestions({ ptoDays: effectivePtoDays, candidates, strategy });

	const baseAlternatives = generateAlternatives({
		ptoDays: effectivePtoDays,
		candidates,
		maxAlternatives,
		existingSuggestion: baseSuggestion.days,
		strategy,
	});

	return {
		planned: true,
		suggestion: measure(baseSuggestion),
		alternatives: baseAlternatives.map(measure),
	};
}

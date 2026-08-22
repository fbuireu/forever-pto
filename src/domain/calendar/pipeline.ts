import { type HolidayDTO, HolidayVariant } from "@application/dto/holiday/types";
import type { Locale } from "next-intl";
import { generateAlternatives } from "./alternatives/generateAlternatives";
import { generateMetrics } from "./metrics/generateMetrics";
import { MONTHS_IN_YEAR } from "./metrics/utils/helpers";
import { generateSuggestions } from "./suggestions/generateSuggestions";
import type { FilterStrategy, MeasuredSuggestion, Suggestion } from "./types";
import { clearDateKeyCache, clearHolidayCache } from "./utils/cache";

export interface PlanningInput {
	year: number;
	ptoDays: number;
	autoSuggestCount?: number;
	holidays: HolidayDTO[];
	manuallySelectedDays?: Date[];
	removedSuggestedDays?: Date[];
	allowPastDays: boolean;
	months: Date[];
	strategy: FilterStrategy;
	locale: Locale;
	maxAlternatives: number;
}

export type PlanningResult =
	| { planned: true; suggestion: MeasuredSuggestion; alternatives: MeasuredSuggestion[] }
	| { planned: false; suggestion: MeasuredSuggestion; alternatives: [] };

const MANUAL_DAY_NAME = "Manual day";

export function runPlanningPipeline({
	year,
	ptoDays,
	autoSuggestCount,
	holidays,
	manuallySelectedDays = [],
	removedSuggestedDays = [],
	allowPastDays,
	months,
	strategy,
	locale,
	maxAlternatives,
}: PlanningInput): PlanningResult {
	clearDateKeyCache();
	clearHolidayCache();

	const carryOverMonths = Math.max(0, months.length - MONTHS_IN_YEAR);
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
			year,
			bridges: suggestion.bridges,
			holidays: holidaysWithManual,
			allowPastDays,
			manuallySelectedDays,
			removedSuggestedDays,
			carryOverMonths,
		}),
	});

	if (effectivePtoDays <= 0 || holidaysWithManual.length === 0) {
		return { planned: false, suggestion: measure({ days: [], bridges: [], strategy }), alternatives: [] };
	}

	const baseSuggestion = generateSuggestions({
		ptoDays: effectivePtoDays,
		holidays: holidaysWithManual,
		allowPastDays,
		months,
		strategy,
		removedDays: removedSuggestedDays,
	});

	const baseAlternatives = generateAlternatives({
		ptoDays: effectivePtoDays,
		holidays: holidaysWithManual,
		allowPastDays,
		months,
		maxAlternatives,
		existingSuggestion: baseSuggestion.days,
		strategy,
		removedDays: removedSuggestedDays,
	});

	return {
		planned: true,
		suggestion: measure(baseSuggestion),
		alternatives: baseAlternatives.map(measure),
	};
}

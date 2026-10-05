import type { Strategy } from "@domain/calendar/types";
import { type PlanningCandidates, selectionInputOf } from "@domain/calendar/utils/candidates";
import { selectBridgesForStrategy } from "./utils/selectors";

export interface GenerateSuggestionsParams {
	ptoDays: number;
	candidates: PlanningCandidates;
	strategy: Strategy;
	preferredMonths?: number[];
}

export function generateSuggestions({ ptoDays, candidates, strategy, preferredMonths }: GenerateSuggestionsParams) {
	if (ptoDays <= 0 || candidates.availableWorkdays.length === 0) {
		return { days: [], bridges: [], strategy };
	}

	const { days, bridges } = selectBridgesForStrategy({
		...selectionInputOf({ candidates, ptoDays, preferredMonths }),
		strategy,
	});

	return { days, bridges, strategy };
}

import type { FilterStrategy } from "../types";
import type { PlanningCandidates } from "../utils/candidates";
import { selectBridgesForStrategy } from "./utils/selectors";

export interface GenerateSuggestionsParams {
	ptoDays: number;
	candidates: PlanningCandidates;
	strategy: FilterStrategy;
	preferredMonths?: number[];
}

export function generateSuggestions({ ptoDays, candidates, strategy, preferredMonths }: GenerateSuggestionsParams) {
	if (ptoDays <= 0) {
		return { days: [], bridges: [], strategy };
	}

	const { availableWorkdays, bridges } = candidates;

	if (availableWorkdays.length === 0) {
		return { days: [], bridges: [], strategy };
	}

	const effectivePtoDays = Math.min(availableWorkdays.length, ptoDays);

	const selection = selectBridgesForStrategy({
		bridges,
		targetPtoDays: effectivePtoDays,
		strategy,
		preferredMonths,
	});

	return {
		days: selection.days,
		bridges: selection.bridges,
		strategy,
	};
}

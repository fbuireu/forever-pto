import { PTO_CONSTANTS } from "../const";
import { objectiveFor, selectBridges } from "../suggestions/utils/selectors";
import { FilterStrategy, type Suggestion } from "../types";
import type { PlanningCandidates } from "../utils/candidates";
import { planDistance, restBlocksOf } from "./utils/helpers";

export interface GenerateAlternativesParams {
	ptoDays: number;
	candidates: PlanningCandidates;
	maxAlternatives: number;
	existingSuggestion: Date[];
	strategy: FilterStrategy;
}

interface Seed {
	days: Date[];
	excludedDays: Date[];
}

export function generateAlternatives(params: GenerateAlternativesParams) {
	const { ptoDays, candidates, maxAlternatives, existingSuggestion, strategy } = params;

	if (ptoDays <= 0 || maxAlternatives <= 0 || existingSuggestion.length === 0) {
		return [];
	}

	const { bridges } = candidates;
	const objective = objectiveFor(strategy);
	const alternatives: Suggestion[] = [];
	const maxRuns = maxAlternatives * PTO_CONSTANTS.ALTERNATIVES.RUNS_PER_ALTERNATIVE;
	let runs = 0;

	const offer = ({ days, bridges: selected }: Pick<Suggestion, "days" | "bridges">) => {
		if (days.length === 0) return;
		const plans = [existingSuggestion, ...alternatives.map((alternative) => alternative.days)];
		if (plans.some((plan) => planDistance({ plan, rival: days }) < PTO_CONSTANTS.ALTERNATIVES.MIN_DIFFERENCE)) return;

		alternatives.push({ days, bridges: selected, strategy });
	};

	for (const other of Object.values(FilterStrategy)) {
		if (other === strategy || alternatives.length >= maxAlternatives) continue;
		runs++;
		offer(selectBridges({ bridges, targetPtoDays: ptoDays, objective: objectiveFor(other) }));
	}

	const seeds: Seed[] = [{ days: existingSuggestion, excludedDays: [] }];

	for (let next = 0; next < seeds.length; next++) {
		const seed = seeds[next];
		if (seed === undefined) break;

		for (const block of restBlocksOf(seed.days)) {
			if (alternatives.length >= maxAlternatives || runs >= maxRuns) return alternatives;

			const excludedDays = [...seed.excludedDays, ...block];
			runs++;
			const selection = selectBridges({ bridges, targetPtoDays: ptoDays, objective, excludedDays });
			offer(selection);
			if (selection.days.length > 0) seeds.push({ days: selection.days, excludedDays });
		}
	}

	return alternatives;
}

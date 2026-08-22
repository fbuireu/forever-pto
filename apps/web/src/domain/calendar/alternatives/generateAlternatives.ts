import { selectBridgesForStrategy } from "../suggestions/utils/selectors";
import type { Bridge, FilterStrategy, Suggestion } from "../types";
import { getCombinationKey } from "../utils/cache";
import type { PlanningCandidates } from "../utils/candidates";

export interface GenerateAlternativesParams {
	ptoDays: number;
	candidates: PlanningCandidates;
	maxAlternatives: number;
	existingSuggestion: Date[];
	strategy: FilterStrategy;
}

export function generateAlternatives(params: GenerateAlternativesParams) {
	const { ptoDays, candidates, maxAlternatives, existingSuggestion, strategy } = params;

	if (ptoDays <= 0 || maxAlternatives <= 0 || existingSuggestion.length === 0) {
		return [];
	}

	const { bridges } = candidates;

	const existingSuggestionSet = new Set(existingSuggestion.map((d) => d.getTime()));
	const availableBridges = bridges.filter(
		(bridge) => !bridge.ptoDays.some((day) => existingSuggestionSet.has(day.getTime())),
	);

	const alternatives: Suggestion[] = [];
	const usedCombinations = new Set<string>();

	const sortingStrategies = [
		(a: Bridge, b: Bridge) => b.efficiency - a.efficiency,
		(a: Bridge, b: Bridge) => b.effectiveDays - a.effectiveDays,
		(a: Bridge, b: Bridge) => b.ptoDaysNeeded - a.ptoDaysNeeded,
		(a: Bridge, b: Bridge) => b.efficiency * b.ptoDaysNeeded - a.efficiency * a.ptoDaysNeeded,
		(a: Bridge, b: Bridge) => (a.ptoDays[0]?.getMonth() || 0) - (b.ptoDays[0]?.getMonth() || 0),
		(a: Bridge, b: Bridge) => a.efficiency - b.efficiency,
		(a: Bridge, b: Bridge) => Math.sin(a.efficiency * 1000) - Math.sin(b.efficiency * 1000),
	];
	const maxAttempts = Math.max(maxAlternatives * 3, 15);
	const sortedVariants = sortingStrategies.map((fn) => availableBridges.toSorted(fn));

	for (let attempt = 0; attempt < maxAttempts && alternatives.length < maxAlternatives; attempt++) {
		const strategyIndex = attempt % sortingStrategies.length;
		const shuffledBridges = [...sortedVariants[strategyIndex]];
		if (attempt >= sortingStrategies.length) {
			const rotateBy = attempt - sortingStrategies.length + 1;
			shuffledBridges.push(...shuffledBridges.splice(0, rotateBy % Math.max(shuffledBridges.length, 1)));
		}
		const selection = selectBridgesForStrategy({
			bridges: shuffledBridges,
			targetPtoDays: ptoDays,
			strategy,
			presorted: true,
		});
		if (selection.days.length > 0) {
			const alternative: Suggestion = {
				days: selection.days.toSorted((a, b) => a.getTime() - b.getTime()),
				bridges: selection.bridges,
				strategy,
			};

			const combinationKey = getCombinationKey(alternative.days);
			if (!usedCombinations.has(combinationKey)) {
				alternatives.push(alternative);
				usedCombinations.add(combinationKey);
			}
		}
	}

	return alternatives.map((alt) => ({
		days: alt.days.toSorted((a, b) => a.getTime() - b.getTime()),
		bridges: alt.bridges,
		strategy: alt.strategy,
	}));
}

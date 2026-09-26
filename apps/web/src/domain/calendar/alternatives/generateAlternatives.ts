import { dayIndex } from "@application/shared/utils/dates";
import { PTO_CONSTANTS } from "../const";
import { restBlocksOf } from "../metrics/utils/helpers";
import { objectiveFor, selectBridges } from "../suggestions/utils/selectors";
import { FilterStrategy, type Suggestion } from "../types";
import type { PlanningCandidates } from "../utils/candidates";
import { measurePlan, planDistance } from "./utils/helpers";

export interface GenerateAlternativesParams {
	ptoDays: number;
	candidates: PlanningCandidates;
	maxAlternatives: number;
	existingSuggestion: Suggestion;
	strategy: FilterStrategy;
	preferredMonths?: number[];
}

export interface PlanChoice {
	suggestion: Suggestion;
	alternatives: Suggestion[];
}

interface Seed {
	days: Date[];
	forbiddenDays: Date[];
}

interface Scored {
	plan: Suggestion;
	covered: number;
	efficiency: number;
	standing: number[];
}

interface OfferParams {
	plan: Suggestion;
	into: Scored[];
}

interface OutscoresParams {
	plan: Scored;
	rival: Scored;
}

const outscores = ({ plan, rival }: OutscoresParams) => {
	for (const [index, value] of plan.standing.entries()) {
		const rivalValue = rival.standing[index] ?? 0;
		if (value !== rivalValue) return value > rivalValue;
	}
	return false;
};

interface StaysBelowParams {
	plan: Scored;
	ceiling: Scored;
}

const staysBelow = ({ plan, ceiling }: StaysBelowParams) =>
	plan.covered <= ceiling.covered && plan.efficiency <= ceiling.efficiency;

export function generateAlternatives(params: GenerateAlternativesParams): PlanChoice {
	const { ptoDays, candidates, maxAlternatives, existingSuggestion, strategy, preferredMonths } = params;

	if (ptoDays <= 0 || maxAlternatives <= 0 || existingSuggestion.days.length === 0) {
		return { suggestion: existingSuggestion, alternatives: [] };
	}

	const { bridges, availableWorkdays, alreadyOff } = candidates;
	const shared = { bridges, targetPtoDays: ptoDays, preferredMonths, workdays: availableWorkdays, alreadyOff };
	const objective = objectiveFor(strategy);
	const maxRuns = maxAlternatives * PTO_CONSTANTS.ALTERNATIVES.RUNS_PER_ALTERNATIVE;
	let runs = 0;

	const score = (plan: Suggestion): Scored => {
		const measures = measurePlan({
			plan,
			alreadyOff,
			workdays: availableWorkdays,
			preferredMonths: preferredMonths ?? [],
		});
		return {
			plan,
			covered: measures.covered,
			efficiency: measures.efficiency,
			standing: [objective.aim(measures), measures.covered, measures.efficiency],
		};
	};

	const main = score(existingSuggestion);
	const own: Scored[] = [];
	const foreign: Scored[] = [];

	const best = () => own.reduce((leader, plan) => (outscores({ plan, rival: leader }) ? plan : leader), main);
	const offered = () => {
		const leader = best();
		return [...foreign, ...own, main].filter((plan) => plan !== leader && staysBelow({ plan, ceiling: leader }));
	};

	const offer = ({ plan, into }: OfferParams) => {
		if (plan.days.length === 0) return;
		const plans = [main, ...own, ...foreign].map(({ plan: { days } }) => days);
		if (
			plans.some((days) => planDistance({ plan: days, rival: plan.days }) < PTO_CONSTANTS.ALTERNATIVES.MIN_DIFFERENCE)
		) {
			return;
		}
		into.push(score(plan));
	};

	for (const other of Object.values(FilterStrategy)) {
		if (other === strategy) continue;
		runs++;
		offer({
			plan: { ...selectBridges({ ...shared, objective: objectiveFor(other) }), strategy: other },
			into: foreign,
		});
	}

	const seeds: Seed[] = [{ days: existingSuggestion.days, forbiddenDays: [] }];
	const keyOf = (days: Date[]) =>
		days
			.map(dayIndex)
			.toSorted((a, b) => a - b)
			.join();
	const triedExclusions = new Set<string>();
	const seenPlans = new Set([keyOf(existingSuggestion.days)]);

	search: for (let next = 0; next < seeds.length; next++) {
		const seed = seeds[next];
		if (seed === undefined) break;

		for (const block of restBlocksOf(seed.days).toSorted((a, b) => b.length - a.length)) {
			if (offered().length >= maxAlternatives || runs >= maxRuns) break search;

			const forbiddenDays = [...seed.forbiddenDays, ...block];
			const exclusion = keyOf(forbiddenDays);
			if (triedExclusions.has(exclusion)) continue;
			triedExclusions.add(exclusion);

			runs++;
			const selection = selectBridges({ ...shared, objective, forbiddenDays });
			const planKey = keyOf(selection.days);
			if (selection.days.length === 0 || seenPlans.has(planKey)) continue;
			seenPlans.add(planKey);

			offer({ plan: { ...selection, strategy }, into: own });
			seeds.push({ days: selection.days, forbiddenDays });
		}
	}

	return {
		suggestion: best().plan,
		alternatives: offered()
			.slice(0, maxAlternatives)
			.map(({ plan }) => plan),
	};
}

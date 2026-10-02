import { PTO_CONSTANTS } from "@domain/calendar/const";
import { restBlocksOf } from "@domain/calendar/metrics/utils/helpers";
import { objectiveFor, outranks, selectBridges } from "@domain/calendar/suggestions/utils/selectors";
import { FilterStrategy, type Suggestion } from "@domain/calendar/types";
import { getCombinationKey } from "@domain/calendar/utils/cache";
import { type PlanningCandidates, selectionInputOf } from "@domain/calendar/utils/candidates";
import { measurePlan } from "@domain/calendar/utils/measures";
import { planDistance } from "./utils/helpers";

export interface GenerateAlternativesParams {
	ptoDays: number;
	candidates: PlanningCandidates;
	maxAlternatives: number;
	existingSuggestion: Suggestion;
	strategy: FilterStrategy;
	preferredMonths?: number[];
}

interface PlanChoice {
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

interface StaysBelowParams {
	plan: Scored;
	ceiling: Scored;
}

const staysBelow = ({ plan, ceiling }: StaysBelowParams) =>
	plan.covered <= ceiling.covered && plan.efficiency <= ceiling.efficiency;

export function generateAlternatives(params: GenerateAlternativesParams): PlanChoice {
	const { ptoDays, candidates, maxAlternatives, existingSuggestion, strategy, preferredMonths } = params;

	if (ptoDays <= 0 || existingSuggestion.days.length === 0) {
		return { suggestion: existingSuggestion, alternatives: [] };
	}

	const shared = selectionInputOf({ candidates, ptoDays, preferredMonths });
	const objective = objectiveFor(strategy);
	const { SEARCHED, RUNS_PER_ALTERNATIVE } = PTO_CONSTANTS.ALTERNATIVES;
	const maxRuns = SEARCHED * RUNS_PER_ALTERNATIVE;
	let runs = 0;

	const score = (plan: Suggestion): Scored => {
		const measures = measurePlan({
			plan,
			alreadyOff: candidates.alreadyOff,
			manualDays: candidates.manualDays,
			workdays: candidates.availableWorkdays,
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

	const best = () =>
		own.reduce((leader, plan) => (outranks({ rank: plan.standing, rival: leader.standing }) ? plan : leader), main);
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
	const triedExclusions = new Set<string>();
	const seenPlans = new Set([getCombinationKey(existingSuggestion.days)]);

	search: for (let next = 0; next < seeds.length; next++) {
		const seed = seeds[next];
		if (seed === undefined) break;

		for (const block of restBlocksOf(seed.days).toSorted((a, b) => b.length - a.length)) {
			if (offered().length >= SEARCHED || runs >= maxRuns) break search;

			const forbiddenDays = [...seed.forbiddenDays, ...block];
			const exclusion = getCombinationKey(forbiddenDays);
			if (triedExclusions.has(exclusion)) continue;
			triedExclusions.add(exclusion);

			runs++;
			const selection = selectBridges({ ...shared, objective, forbiddenDays });
			const planKey = getCombinationKey(selection.days);
			if (selection.days.length === 0 || seenPlans.has(planKey)) continue;
			seenPlans.add(planKey);

			offer({ plan: { ...selection, strategy }, into: own });
			seeds.push({ days: selection.days, forbiddenDays });
		}
	}

	return {
		suggestion: best().plan,
		alternatives: offered()
			.slice(0, Math.max(0, maxAlternatives))
			.map(({ plan }) => plan),
	};
}

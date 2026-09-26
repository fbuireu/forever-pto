import { dayIndex } from "@application/shared/utils/dates";
import { PTO_CONSTANTS } from "@domain/calendar/const";
import type { PlanMeasures } from "@domain/calendar/suggestions/utils/selectors";
import { longestWorkStretch } from "@domain/calendar/suggestions/utils/stretches";
import type { Suggestion } from "@domain/calendar/types";

export interface PlanDistanceParams {
	plan: Date[];
	rival: Date[];
}

export const planDistance = ({ plan, rival }: PlanDistanceParams) => {
	const planDays = new Set(plan.map(dayIndex));
	const rivalDays = new Set(rival.map(dayIndex));
	const union = new Set([...planDays, ...rivalDays]).size;
	if (union === 0) return 0;
	const shared = [...planDays].filter((day) => rivalDays.has(day)).length;

	return 1 - shared / union;
};

export interface CoveredDaysParams extends Pick<Suggestion, "days" | "bridges"> {
	alreadyOff?: Date[];
}

const coveredSetOf = ({ days, bridges = [], alreadyOff = [] }: CoveredDaysParams) => {
	const covered = new Set([...days, ...alreadyOff].map(dayIndex));
	for (const bridge of bridges) {
		for (let day = dayIndex(bridge.startDate); day <= dayIndex(bridge.endDate); day++) covered.add(day);
	}

	return covered;
};

export const coveredDays = (params: CoveredDaysParams) => coveredSetOf(params).size;

export interface MeasurePlanParams {
	plan: Pick<Suggestion, "days" | "bridges">;
	alreadyOff: Date[];
	workdays: Date[];
	preferredMonths: number[];
}

export const measurePlan = ({ plan, alreadyOff, workdays, preferredMonths }: MeasurePlanParams): PlanMeasures => {
	const covered = coveredSetOf({ ...plan, alreadyOff });
	const placed = new Map(plan.days.map((day) => [dayIndex(day), day.getMonth()]));
	const preferred = new Set(preferredMonths);
	const sorted = [...covered].toSorted((a, b) => a - b);

	let longestBreak = 0;
	let longestPreferredBreak = 0;
	let runStart = 0;

	sorted.forEach((day, position) => {
		const nextDay = sorted[position + 1];
		if (nextDay === day + 1) return;

		const run = sorted.slice(runStart, position + 1);
		const months = run.flatMap((runDay) => {
			const month = placed.get(runDay);
			return month === undefined ? [] : [month];
		});
		longestBreak = Math.max(longestBreak, run.length);
		if (months.length > 0 && (preferred.size === 0 || months.every((month) => preferred.has(month)))) {
			longestPreferredBreak = Math.max(longestPreferredBreak, run.length);
		}
		runStart = position + 1;
	});

	return {
		covered: covered.size,
		efficiency: plan.days.length > 0 ? covered.size / plan.days.length : 0,
		longestBreak,
		longestPreferredBreak,
		longestWorkStretch: longestWorkStretch({
			workdays: [...new Set(workdays.map(dayIndex))].toSorted((a, b) => a - b),
			off: covered,
		}),
	};
};

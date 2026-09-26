import { dayIndex } from "@application/shared/utils/dates";
import type { Suggestion } from "../types";
import { inPreferredMonths } from "../window";
import { longestWorkStretch } from "./stretches";

export interface PlanMeasures {
	covered: number;
	efficiency: number;
	longestVacation: number;
	longestPreferredVacation: number;
	longestWorkStretch: number;
}

export interface MeasurePlanParams {
	plan: Pick<Suggestion, "days" | "bridges">;
	alreadyOff: Date[];
	manualDays: Date[];
	workdays: Date[];
	preferredMonths: number[];
}

const coveredSetOf = ({ plan: { days, bridges = [] }, alreadyOff }: Pick<MeasurePlanParams, "plan" | "alreadyOff">) => {
	const covered = new Set([...days, ...alreadyOff].map(dayIndex));
	for (const bridge of bridges) {
		for (let day = dayIndex(bridge.startDate); day <= dayIndex(bridge.endDate); day++) covered.add(day);
	}

	return covered;
};

export const measurePlan = ({
	plan,
	alreadyOff,
	manualDays,
	workdays,
	preferredMonths,
}: MeasurePlanParams): PlanMeasures => {
	const covered = coveredSetOf({ plan, alreadyOff });
	const placed = new Map(plan.days.map((day) => [dayIndex(day), day.getMonth()]));
	const preferred = new Set(preferredMonths);
	const sorted = [...covered].toSorted((a, b) => a - b);
	const spent = plan.days.length + manualDays.length;

	let longestVacation = 0;
	let longestPreferredVacation = 0;
	let runStart = 0;

	sorted.forEach((day, position) => {
		if (sorted[position + 1] === day + 1) return;

		const run = sorted.slice(runStart, position + 1);
		const months = run.flatMap((runDay) => {
			const month = placed.get(runDay);
			return month === undefined ? [] : [month];
		});
		longestVacation = Math.max(longestVacation, run.length);
		if (months.length > 0 && inPreferredMonths({ months, preferredMonths: preferred })) {
			longestPreferredVacation = Math.max(longestPreferredVacation, run.length);
		}
		runStart = position + 1;
	});

	return {
		covered: covered.size,
		efficiency: spent > 0 ? covered.size / spent : 0,
		longestVacation,
		longestPreferredVacation,
		longestWorkStretch: longestWorkStretch({
			workdays: [...new Set(workdays.map(dayIndex))].toSorted((a, b) => a - b),
			off: covered,
		}),
	};
};

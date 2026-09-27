import { dayIndex } from "@application/shared/utils/dates";

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

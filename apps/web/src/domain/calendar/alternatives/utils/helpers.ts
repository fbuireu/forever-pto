import { dayIndex } from "@application/shared/utils/dates";
import { PTO_CONSTANTS } from "@domain/calendar/const";
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

export const coveredDays = ({ days, bridges = [] }: Pick<Suggestion, "days" | "bridges">) => {
	const covered = new Set(days.map(dayIndex));
	for (const bridge of bridges) {
		for (let day = dayIndex(bridge.startDate); day <= dayIndex(bridge.endDate); day++) covered.add(day);
	}

	return covered.size;
};

export const restBlocksOf = (days: Date[]) => {
	const blocks: Date[][] = [];
	const sorted = days.toSorted((a, b) => a.getTime() - b.getTime());

	for (const day of sorted) {
		const block = blocks.at(-1);
		const previous = block?.at(-1);
		if (block && previous && dayIndex(day) - dayIndex(previous) <= PTO_CONSTANTS.METRICS.REST_BLOCK_SEPARATION_DAYS) {
			block.push(day);
		} else {
			blocks.push([day]);
		}
	}

	return blocks.toSorted((a, b) => b.length - a.length);
};

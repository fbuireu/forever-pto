import { addMonths, startOfMonth } from "@application/shared/utils/dates";

export const MONTHS_IN_YEAR = 12;
export const MONTHS_IN_QUARTER = 3;

export interface PlanningWindow {
	year: number;
	carryOverMonths: number;
}

export const windowMonthCount = ({ carryOverMonths }: Pick<PlanningWindow, "carryOverMonths">) =>
	MONTHS_IN_YEAR + carryOverMonths;

export const windowQuarterCount = (window: Pick<PlanningWindow, "carryOverMonths">) =>
	Math.ceil(windowMonthCount(window) / MONTHS_IN_QUARTER);

export const planningWindowMonths = (window: PlanningWindow): Date[] => {
	const start = startOfMonth(new Date(window.year, 0, 1));

	return Array.from({ length: windowMonthCount(window) }, (_, index) => addMonths(start, index));
};

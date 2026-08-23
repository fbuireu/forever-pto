import { addMonths, endOfYear, isWithinInterval, startOfMonth } from "@application/shared/utils/dates";

export const MONTHS_IN_YEAR = 12;
export const MONTHS_IN_QUARTER = 3;
export const MAX_CARRY_OVER_MONTHS = 12;

export interface PlanningWindow {
	year: number;
	carryOverMonths: number;
}

export interface PlanningWindowInterval {
	start: Date;
	end: Date;
}

export const windowMonthCount = ({ carryOverMonths }: Pick<PlanningWindow, "carryOverMonths">) =>
	MONTHS_IN_YEAR + carryOverMonths;

export const windowQuarterCount = (window: Pick<PlanningWindow, "carryOverMonths">) =>
	Math.ceil(windowMonthCount(window) / MONTHS_IN_QUARTER);

export const planningWindowMonths = (window: PlanningWindow): Date[] => {
	const start = startOfMonth(new Date(window.year, 0, 1));

	return Array.from({ length: windowMonthCount(window) }, (_, index) => addMonths({ date: start, months: index }));
};

export const planningWindowInterval = ({ year, carryOverMonths }: PlanningWindow): PlanningWindowInterval => ({
	start: new Date(year, 0, 1),
	end: addMonths({ date: endOfYear(new Date(year, 0, 1)), months: carryOverMonths }),
});

export interface IsInPlanningWindowParams {
	date: Date;
	window: PlanningWindowInterval;
}

export const isInPlanningWindow = ({ date, window }: IsInPlanningWindowParams): boolean =>
	isWithinInterval({ date, ...window });

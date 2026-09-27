import { addMonths, endOfYear, isWithinInterval, startOfMonth } from "@application/shared/utils/dates";

export const MONTHS_IN_YEAR = 12;
export const MONTHS_IN_QUARTER = 3;
export const MAX_CARRY_OVER_MONTHS = 12;

export const DEFAULT_PREFERRED_MONTHS: readonly number[] = [];

export const isPreferredMonths = (value: unknown): value is number[] =>
	Array.isArray(value) &&
	new Set(value).size === value.length &&
	value.every((month) => Number.isInteger(month) && month >= 0 && month < MONTHS_IN_YEAR + MAX_CARRY_OVER_MONTHS);

interface InPreferredMonthsParams {
	months: number[];
	preferredMonths: ReadonlySet<number>;
}

export const inPreferredMonths = ({ months, preferredMonths }: InPreferredMonthsParams) =>
	preferredMonths.size === 0 || months.every((month) => preferredMonths.has(month));

export interface PlanningWindow {
	year: number;
	carryOverMonths: number;
}

interface PlanningWindowInterval {
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

export interface ReachableMonthsParams extends PlanningWindow {
	allowPastDays: boolean;
	today: Date;
}

export const reachableMonths = ({
	year,
	carryOverMonths,
	allowPastDays,
	today,
}: ReachableMonthsParams): ReadonlySet<number> => {
	const currentMonth = startOfMonth(today).getTime();

	return new Set(
		planningWindowMonths({ year, carryOverMonths }).flatMap((month, position) =>
			allowPastDays || month.getTime() >= currentMonth ? [position] : [],
		),
	);
};

export const monthKeyOf = (date: Date) => date.getFullYear() * MONTHS_IN_YEAR + date.getMonth();

export interface PreferredMonthKeysParams {
	year: number;
	preferredMonths: readonly number[];
}

export const preferredMonthKeys = ({ year, preferredMonths }: PreferredMonthKeysParams) =>
	preferredMonths.map((position) => year * MONTHS_IN_YEAR + position);

export interface ReachablePreferredMonthsParams {
	preferredMonths: readonly number[];
	reachable: ReadonlySet<number>;
}

export const reachablePreferredMonths = ({ preferredMonths, reachable }: ReachablePreferredMonthsParams) =>
	preferredMonths.filter((month) => reachable.has(month));

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

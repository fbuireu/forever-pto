import type { HolidayDTO } from "@application/dto/holiday/types";
import type { Bridge } from "@domain/calendar/types";
import { findBridges, freeDaysAround, getAvailableWorkdays } from "./helpers";

export interface PlanningCandidates {
	availableWorkdays: Date[];
	bridges: Bridge[];
	manualDays: Date[];
	alreadyOff: Date[];
}

interface FindPlanningCandidatesParams {
	holidays: HolidayDTO[];
	months: Date[];
	allowPastDays: boolean;
	removedDays?: Date[];
	manualDays: Date[];
}

export const findPlanningCandidates = ({
	holidays,
	months,
	allowPastDays,
	removedDays,
	manualDays,
}: FindPlanningCandidatesParams): PlanningCandidates => {
	const availableWorkdays = getAvailableWorkdays({ months, holidays, allowPastDays, removedDays });

	return {
		availableWorkdays,
		bridges: findBridges({ availableWorkdays, holidays }),
		manualDays,
		alreadyOff: freeDaysAround({ days: manualDays, holidays }),
	};
};

interface SelectionInputOfParams {
	candidates: PlanningCandidates;
	ptoDays: number;
	preferredMonths?: number[];
}

export const selectionInputOf = ({
	candidates: { bridges, availableWorkdays, alreadyOff },
	ptoDays,
	preferredMonths,
}: SelectionInputOfParams) => ({
	bridges,
	targetPtoDays: ptoDays,
	preferredMonths,
	workdays: availableWorkdays,
	alreadyOff,
});

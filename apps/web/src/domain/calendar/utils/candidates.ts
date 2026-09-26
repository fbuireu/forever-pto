import type { HolidayDTO } from "@application/dto/holiday/types";
import type { Bridge } from "../types";
import { findBridges, freeDaysAround, getAvailableWorkdays } from "./helpers";

export interface PlanningCandidates {
	availableWorkdays: Date[];
	bridges: Bridge[];
	alreadyOff: Date[];
}

interface FindPlanningCandidatesParams {
	holidays: HolidayDTO[];
	months: Date[];
	allowPastDays: boolean;
	removedDays?: Date[];
	manualDays?: Date[];
}

export const findPlanningCandidates = ({
	holidays,
	months,
	allowPastDays,
	removedDays,
	manualDays = [],
}: FindPlanningCandidatesParams): PlanningCandidates => {
	const availableWorkdays = getAvailableWorkdays({ months, holidays, allowPastDays, removedDays });

	return {
		availableWorkdays,
		bridges: findBridges({ availableWorkdays, holidays }),
		alreadyOff: freeDaysAround({ days: manualDays, holidays }),
	};
};

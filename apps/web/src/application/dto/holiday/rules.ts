import type { HolidayDTO } from "./types";

export const holidaysInPlanningWindow = (holidays: HolidayDTO[] | undefined): HolidayDTO[] =>
	(holidays ?? []).filter((holiday) => holiday.isInPlanningWindow);

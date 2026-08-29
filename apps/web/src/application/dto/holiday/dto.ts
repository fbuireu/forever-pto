import type { RegionDTO } from "@application/dto/region/types";
import { getRegionName } from "@application/dto/region/utils/helpers";
import type { BaseDTO } from "@application/shared/dto/baseDTO";
import { fromUpstreamCalendarDay } from "@application/shared/utils/dateIntake";
import { compareAsc, isoDateTime } from "@application/shared/utils/dates";
import { isInPlanningWindow, MAX_CARRY_OVER_MONTHS, planningWindowInterval } from "@domain/calendar/window";
import { type HolidayDTO, HolidayVariant, type RawHoliday } from "./types";

type HolidayDTOParams = {
	year: number;
	carryOverMonths: number;
	regions: RegionDTO[];
};

export interface CreateCustomHolidayParams {
	name: string;
	date: Date;
	year: number;
	carryOverMonths: number;
}

type HolidayDTOShape = BaseDTO<RawHoliday[], HolidayDTO[], HolidayDTOParams> & {
	createCustom: (params: CreateCustomHolidayParams) => HolidayDTO;
};

export const holidayDTO: HolidayDTOShape = {
	create: ({ raw, params }: { raw: RawHoliday[]; params: HolidayDTOParams }) => {
		const { year, carryOverMonths, regions } = params;
		const processedDates = new Set<string>();

		const holidayDataWindow = planningWindowInterval({ year, carryOverMonths: MAX_CARRY_OVER_MONTHS });
		const planningWindow = planningWindowInterval({ year, carryOverMonths });

		return raw
			.toSorted((a, b) => Number(!!a.location) - Number(!!b.location))
			.reduce<HolidayDTO[]>((acc, holiday) => {
				const holidayDate = fromUpstreamCalendarDay(holiday.date);
				if (!isInPlanningWindow({ date: holidayDate, window: holidayDataWindow })) return acc;
				const dateKey = holiday.date;
				if (processedDates.has(dateKey)) return acc;
				processedDates.add(dateKey);
				acc.push({
					id: `${holiday.location ? "regional" : "national"}-${holiday.date}`,
					date: holidayDate,
					name: holiday.name,
					type: holiday.type,
					variant: holiday.location ? HolidayVariant.REGIONAL : HolidayVariant.NATIONAL,
					...(holiday.location && { location: getRegionName({ regionCode: holiday.location, regions }) }),
					isInPlanningWindow: isInPlanningWindow({ date: holidayDate, window: planningWindow }),
				});
				return acc;
			}, [])
			.toSorted((a, b) => compareAsc({ a: a.date, b: b.date }));
	},

	createCustom: ({ name, date, year, carryOverMonths }: CreateCustomHolidayParams) => ({
		id: `custom-${isoDateTime(date)}`,
		name,
		date,
		variant: HolidayVariant.CUSTOM,
		isInPlanningWindow: isInPlanningWindow({ date, window: planningWindowInterval({ year, carryOverMonths }) }),
	}),
};

export const holidaysInPlanningWindow = (holidays: HolidayDTO[] | undefined): HolidayDTO[] =>
	(holidays ?? []).filter((holiday) => holiday.isInPlanningWindow);

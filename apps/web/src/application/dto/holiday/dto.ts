import type { RegionDTO } from "@application/dto/region/types";
import { getRegionName } from "@application/dto/region/utils/helpers";
import type { BaseDTO } from "@application/shared/dto/baseDTO";
import { fromUpstreamCalendarDay } from "@application/shared/utils/dateIntake";
import {
	addMonths,
	compareAsc,
	endOfYear,
	isoDateTime,
	isWithinInterval,
	startOfYear,
} from "@application/shared/utils/dates";
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

export interface PlanningWindowIntervalParams {
	year: number;
	carryOverMonths: number;
}

export interface PlanningWindowInterval {
	start: Date;
	end: Date;
}

export const planningWindowInterval = ({
	year,
	carryOverMonths,
}: PlanningWindowIntervalParams): PlanningWindowInterval => ({
	start: new Date(year, 0, 1),
	end: addMonths({ date: endOfYear(new Date(year, 0, 1)), months: carryOverMonths }),
});

export interface IsInPlanningWindowParams {
	date: Date;
	window: PlanningWindowInterval;
}

export const isInPlanningWindow = ({ date, window }: IsInPlanningWindowParams): boolean =>
	isWithinInterval({ date, ...window });

export const holidayDTO: HolidayDTOShape = {
	create: ({ raw, params }: { raw: RawHoliday[]; params: HolidayDTOParams }) => {
		const { year, carryOverMonths, regions } = params;
		const processedDates = new Set<string>();

		const yearStart = startOfYear(new Date(year, 0, 1));
		const nextYearEnd = endOfYear(new Date(year + 1, 0, 1));
		const planningWindow = planningWindowInterval({ year, carryOverMonths });

		return raw
			.toSorted((a, b) => Number(!!a.location) - Number(!!b.location))
			.reduce<HolidayDTO[]>((acc, holiday) => {
				const holidayDate = fromUpstreamCalendarDay(holiday.date);
				if (!isWithinInterval({ date: holidayDate, start: yearStart, end: nextYearEnd })) return acc;
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
					isInSelectedRange: isInPlanningWindow({ date: holidayDate, window: planningWindow }),
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
		isInSelectedRange: isInPlanningWindow({ date, window: planningWindowInterval({ year, carryOverMonths }) }),
	}),
};

export const holidaysInPlanningWindow = (holidays: HolidayDTO[] | undefined): HolidayDTO[] =>
	(holidays ?? []).filter(({ isInSelectedRange }) => isInSelectedRange);

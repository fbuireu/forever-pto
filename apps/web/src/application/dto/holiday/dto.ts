import type { RegionDTO } from '@application/dto/region/types';
import { getRegionName } from '@application/dto/region/utils/helpers';
import type { BaseDTO } from '@application/shared/dto/baseDTO';
import { fromStoredInstant, fromUpstreamCalendarDay } from '@application/shared/utils/dateIntake';
import {
  addMonths,
  compareAsc,
  endOfYear,
  isoDateTime,
  isWithinInterval,
  startOfYear,
} from '@application/shared/utils/dates';
import { type HolidayDTO, HolidayVariant, type RawHoliday } from './types';

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
  normalize: (holidays: HolidayDTO[]) => HolidayDTO[];
};

export interface PlanningWindowBounds {
  date: Date;
  year: number;
  carryOverMonths: number;
}

export const isInPlanningWindow = ({ date, year, carryOverMonths }: PlanningWindowBounds): boolean =>
  isWithinInterval(date, {
    start: startOfYear(new Date(year, 0, 1)),
    end: addMonths(endOfYear(new Date(year, 0, 1)), carryOverMonths),
  });

export const holidayDTO: HolidayDTOShape = {
  create: ({ raw, params }: { raw: RawHoliday[]; params?: HolidayDTOParams }) => {
    if (!params) {
      throw new Error('Configuration is required for holiday DTO');
    }

    const { year, carryOverMonths, regions } = params;
    const processedDates = new Set<string>();

    const yearStart = startOfYear(new Date(year, 0, 1));
    const nextYearEnd = endOfYear(new Date(year + 1, 0, 1));

    return raw
      .toSorted((a, b) => Number(!!a.location) - Number(!!b.location))
      .reduce<HolidayDTO[]>((acc, holiday) => {
        const holidayDate = fromUpstreamCalendarDay(holiday.date);
        if (!isWithinInterval(holidayDate, { start: yearStart, end: nextYearEnd })) return acc;
        const dateKey = holiday.date;
        if (processedDates.has(dateKey)) return acc;
        processedDates.add(dateKey);
        acc.push({
          id: `${holiday.location ? 'regional' : 'national'}-${holiday.date}`,
          date: holidayDate,
          name: holiday.name,
          type: holiday.type,
          variant: holiday.location ? HolidayVariant.REGIONAL : HolidayVariant.NATIONAL,
          ...(holiday.location && { location: getRegionName(holiday.location, regions) }),
          isInSelectedRange: isInPlanningWindow({ date: holidayDate, year, carryOverMonths }),
        });
        return acc;
      }, [])
      .toSorted((a, b) => compareAsc(a.date, b.date));
  },

  createCustom: ({ name, date, year, carryOverMonths }: CreateCustomHolidayParams) => ({
    id: `custom-${isoDateTime(date)}`,
    name,
    date: fromStoredInstant(date),
    variant: HolidayVariant.CUSTOM,
    isInSelectedRange: isInPlanningWindow({ date, year, carryOverMonths }),
  }),

  normalize: (holidays: HolidayDTO[]) => holidays.map((h) => ({ ...h, date: fromStoredInstant(h.date) })),
};

export const holidaysInPlanningWindow = (holidays: HolidayDTO[] | undefined): HolidayDTO[] =>
  (holidays ?? []).filter(({ isInSelectedRange }) => isInSelectedRange);

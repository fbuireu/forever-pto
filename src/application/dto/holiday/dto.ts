import type { RegionDTO } from '@application/dto/region/types';
import { getRegionName } from '@application/dto/region/utils/helpers';
import type { BaseDTO } from '@application/shared/dto/baseDTO';
import {
  addMonths,
  compareAsc,
  endOfYear,
  ensureDate,
  formatDate,
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
  locale: string;
  year: number;
  carryOverMonths: number;
}

type HolidayDTOShape = BaseDTO<RawHoliday[], HolidayDTO[], HolidayDTOParams> & {
  createCustom: (params: CreateCustomHolidayParams) => HolidayDTO;
  normalize: (holidays: HolidayDTO[]) => HolidayDTO[];
};

export const holidayDTO: HolidayDTOShape = {
  create: ({ raw, params }: { raw: RawHoliday[]; params?: HolidayDTOParams }) => {
    if (!params) {
      throw new Error('Configuration is required for holiday DTO');
    }

    const { year, carryOverMonths, regions } = params;
    const processedDates = new Set<string>();

    const yearStart = startOfYear(new Date(year, 0, 1));
    const nextYearEnd = endOfYear(new Date(year + 1, 0, 1));
    const selectedRangeEnd = addMonths(endOfYear(new Date(year, 0, 1)), carryOverMonths);

    return raw
      .toSorted((a, _) => (a.location ? 1 : -1))
      .reduce<HolidayDTO[]>((acc, holiday) => {
        const holidayDate = new Date(holiday.date);
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
          isInSelectedRange: isWithinInterval(holidayDate, { start: yearStart, end: selectedRangeEnd }),
        });
        return acc;
      }, [])
      .toSorted((a, b) => compareAsc(a.date, b.date));
  },

  createCustom: ({ name, date, locale, year, carryOverMonths }: CreateCustomHolidayParams) => {
    const yearStart = startOfYear(new Date(year, 0, 1));
    const selectedRangeEnd = addMonths(endOfYear(new Date(year, 0, 1)), carryOverMonths);
    return {
      id: `custom-${formatDate({ date, locale, format: 'yyyy-MM-dd HH:mm:ss' })}`,
      name,
      date: ensureDate(date),
      variant: HolidayVariant.CUSTOM,
      isInSelectedRange: isWithinInterval(date, { start: yearStart, end: selectedRangeEnd }),
    };
  },

  normalize: (holidays: HolidayDTO[]) => holidays.map((h) => ({ ...h, date: ensureDate(h.date) })),
};

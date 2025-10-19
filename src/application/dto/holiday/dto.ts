import type { BaseDTO } from '@application/shared/dto/baseDTO';
import { addMonths, compareAsc, endOfYear, isWithinInterval, startOfYear } from 'date-fns';
import { HolidayVariant, type HolidayDTO, type RawHoliday } from './types';
import { getRegionName } from './utils/getRegionName';

type HolidayDTOParams = {
  year: number;
  carryOverMonths: number;
};

export const holidayDTO: BaseDTO<RawHoliday[], HolidayDTO[], HolidayDTOParams> = {
  create: ({ raw, params }) => {
    if (!params) {
      throw new Error('Configuration is required for holiday DTO');
    }

    const { year, carryOverMonths } = params;
    const processedDates = new Set<string>();

    const yearStart = startOfYear(new Date(year, 0, 1));
    const nextYearEnd = endOfYear(new Date(year + 1, 0, 1));
    const selectedRangeEnd = addMonths(endOfYear(new Date(year, 0, 1)), carryOverMonths);

    return raw
      .toSorted((a, _) => (a.location ? 1 : -1))
      .filter((holiday) => {
        const holidayDate = new Date(holiday.date);

        return isWithinInterval(holidayDate, {
          start: yearStart,
          end: nextYearEnd,
        });
      })
      .filter((holiday) => {
        const dateKey = holiday.date;

        if (processedDates.has(dateKey)) return false;
        processedDates.add(dateKey);

        return true;
      })
      .map((holiday) => {
        const holidayDate = new Date(holiday.date);
        const isInSelectedRange = isWithinInterval(holidayDate, {
          start: yearStart,
          end: selectedRangeEnd,
        });

        return {
          id: `${holiday.location ? 'regional' : 'national'}-${holiday.date}`,
          date: holidayDate,
          name: holiday.name,
          type: holiday.type,
          variant: holiday.location ? HolidayVariant.REGIONAL : HolidayVariant.NATIONAL,
          ...(holiday.location && {
            location: getRegionName(holiday.location),
          }),
          isInSelectedRange,
        };
      })
      .toSorted((a, b) => compareAsc(a.date, b.date));
  },
};

import type { BaseDTO } from '@application/shared/dto/baseDTO';
import { addMonths, compareAsc, endOfYear, isWithinInterval, startOfYear } from '@ui/utils/dates';
import { type HolidayDTO, HolidayVariant, type RawHoliday } from './types';
import { getRegionName, isInSelectedRange } from './utils/helpers';

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
          ...(holiday.location && { location: getRegionName(holiday.location) }),
          isInSelectedRange: isInSelectedRange({
            date: holidayDate,
            rangeStart: yearStart,
            rangeEnd: selectedRangeEnd,
          }),
        });
        return acc;
      }, [])
      .toSorted((a, b) => compareAsc(a.date, b.date));
  },
};

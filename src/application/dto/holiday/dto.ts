import { BaseDTO } from '@application/shared/dto/baseDTO';
import { compareAsc, endOfYear, isWithinInterval, startOfYear } from 'date-fns';
import { HolidayDTO, RawHoliday } from './types';
import { getRegionName } from './utils/getRegionName';

type HolidayDTOParams = {
  year: number;
};

export const holidayDTO: BaseDTO<RawHoliday[], HolidayDTO[], HolidayDTOParams> = {
  create: ({ raw, params }) => {
    if (!params) {
      throw new Error('Configuration is required for holiday DTO');
    }
    const { year } = params;
    const processedDates = new Set<string>();

    const yearStart = startOfYear(new Date(year, 0, 1));
    const nextYearEnd = endOfYear(new Date(year + 1, 0, 1));

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
      .map((holiday) => ({
        date: new Date(holiday.date),
        name: holiday.name,
        type: holiday.type,
        variant: holiday.location ? ('regional' as const) : ('national' as const),
        ...(holiday.location && {
          location: getRegionName(holiday.location),
        }),
      }))
      .toSorted((a, b) => compareAsc(a.date, b.date));
  },
};

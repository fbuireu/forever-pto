import { BaseDTO } from '@/shared/application/dto/baseDTO';
import type { RawHoliday, HolidayDTO } from '@/application/dto/holiday/types';

export const holidayDTO: BaseDTO<RawHoliday[], HolidayDTO[], number> = {
  create: ({ raw, configuration: year }) => {
    const nextYear = year + 1

    return raw
        .filter((holiday) => holiday.type === 'public' && (new Date(holiday.date).getFullYear() === year || new Date(holiday.date).getFullYear() === nextYear))
        .map((holiday) => ({
          date: new Date(holiday.date),
          name: holiday.name,
          type: holiday.type,
          ...(holiday.location ? { location: holiday.location } : {})
        }));
  }
};
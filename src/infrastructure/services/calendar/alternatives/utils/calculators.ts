import { HolidayDTO } from "@application/dto/holiday/types";
import { getDateKey } from "@application/stores/utils/helpers";
import { addDays } from "date-fns";

export function calculateOriginalEfficiency(days: Date[], holidays: HolidayDTO[]): number {
  let totalEffective = 0;

  for (const day of days) {
    const dayOfWeek = day.getDay();

    if (dayOfWeek === 5) {
      totalEffective += 3;
    } else if (dayOfWeek === 1) {
      totalEffective += 3;
    } else {
      const holidaySet = new Set(holidays.map((h) => getDateKey(new Date(h.date))));
      const prevKey = getDateKey(addDays(day, -1));
      const nextKey = getDateKey(addDays(day, 1));

      if (holidaySet.has(prevKey) || holidaySet.has(nextKey)) {
        totalEffective += 2;
      } else {
        totalEffective += 1;
      }
    }
  }

  return days.length > 0 ? totalEffective / days.length : 0;
}

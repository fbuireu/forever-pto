import type { HolidayDTO } from '@application/dto/holiday/types';

export function getAvailableWorkdays({
  months,
  holidays,
  allowPastDays,
}: {
  months: Date[];
  holidays: HolidayDTO[];
  allowPastDays: boolean;
}) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayTime = today.getTime();

  // Create holiday set for O(1) lookup
  const holidaySet = new Set<string>();
  for (const holiday of holidays) {
    const date = new Date(holiday.date);
    const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    holidaySet.add(key);
  }

  const workdays: Date[] = [];

  for (const month of months) {
    const year = month.getFullYear();
    const monthNum = month.getMonth();

    // Get days in month more efficiently
    const daysInMonth = new Date(year, monthNum + 1, 0).getDate();

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, monthNum, day);

      // Skip past days if not allowed
      if (!allowPastDays && date.getTime() < todayTime) continue;

      const dayOfWeek = date.getDay();
      // Skip weekends (0 = Sunday, 6 = Saturday)
      if (dayOfWeek === 0 || dayOfWeek === 6) continue;

      // Skip holidays (O(1) lookup)
      const key = `${year}-${monthNum}-${day}`;
      if (holidaySet.has(key)) continue;

      workdays.push(date);
    }
  }

  return workdays;
}

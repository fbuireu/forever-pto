import { differenceInDays } from 'date-fns';
import { PTO_CONSTANTS } from '../../const';

interface StartEndDate {
  start: Date;
  end: Date;
}

export function groupConsecutiveDays(days: Date[]): StartEndDate[] {
  if (days.length === 0) return [];
  const { MAX_DAYS_DIFF_FOR_RANGE } = PTO_CONSTANTS.DAY_GROUPING;

  const ranges: StartEndDate[] = [];
  let currentStart = days[0];
  let currentEnd = days[0];

  for (let i = 1; i < days.length; i++) {
    const daysDiff = differenceInDays(days[i], currentEnd);

    if (daysDiff <= MAX_DAYS_DIFF_FOR_RANGE) {
      currentEnd = days[i];
    } else {
      ranges.push({ start: currentStart, end: currentEnd });
      currentStart = days[i];
      currentEnd = days[i];
    }
  }

  ranges.push({ start: currentStart, end: currentEnd });

  return ranges;
}

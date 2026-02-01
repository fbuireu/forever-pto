import { isWithinInterval } from 'date-fns';

interface IsInSelectedRangeParams {
  date: Date;
  rangeStart: Date;
  rangeEnd: Date;
}

export const isInSelectedRange = ({ date, rangeStart, rangeEnd }: IsInSelectedRangeParams) => {
  return isWithinInterval(date, {
    start: rangeStart,
    end: rangeEnd,
  });
};
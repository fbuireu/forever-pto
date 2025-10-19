import { useLocationStore } from '@application/stores/location';
import { isWithinInterval } from 'date-fns';

export function getRegionName(regionCode: string): string {
  if (!regionCode) return '';

  const regions = useLocationStore.getState().regions;

  const region = regions.find((r) => r.value.toLowerCase() === regionCode.toLowerCase());

  return region?.label ?? regionCode;
}

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
import type { RegionDTO } from '@application/dto/region/types';
import { isWithinInterval } from '@ui/utils/dates';

export function getRegionName(regionCode: string, regions: RegionDTO[]): string {
  if (!regionCode) return '';
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

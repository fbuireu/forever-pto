import type { RegionDTO } from '../types';

export function getRegionName(regionCode: string, regions: RegionDTO[]) {
  if (!regionCode) return '';
  const region = regions.find((r) => r.value.toLowerCase() === regionCode.toLowerCase());
  return region?.label ?? regionCode;
}

import type { RegionService } from '@application/interfaces/location-services';
import type { RegionDTO } from '@application/dto/region/types';

export interface FetchRegionsDependencies {
  regionService: RegionService;
}

export const fetchRegions = (
  countryCode: string,
  deps: FetchRegionsDependencies
): RegionDTO[] => {
  return deps.regionService.getRegions(countryCode);
};

import { regionDTO } from '@application/dto/region/dto';
import type { RegionDTO } from '@application/dto/region/types';
import type { RegionService } from '@application/interfaces/location-services';
import type { Logger } from '@domain/shared/types';
import Holidays from 'date-holidays';

export function getRegions(countryCode: string | undefined, logger: Logger): RegionDTO[] {
  try {
    if (!countryCode) return [];

    const holidays = new Holidays(countryCode);
    const regions = holidays.getStates(countryCode.toLowerCase());

    if (!regions || !Object.values(regions).length) return [];

    return regionDTO.create({ raw: regions }).sort((a, b) => a.label.localeCompare(b.label));
  } catch (error) {
    logger.logError('Error in getRegions', error, { countryCode });
    return [];
  }
}

export const createRegionService = (logger: Logger): RegionService => ({
  getRegions: (countryCode?: string) => getRegions(countryCode, logger),
});

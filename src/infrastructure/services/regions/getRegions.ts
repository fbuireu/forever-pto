import { regionDTO } from '@application/dto/region/dto';
import { getBetterStackInstance } from '@infrastructure/clients/logging/better-stack/client';
import Holidays from 'date-holidays';

const logger = getBetterStackInstance();

export function getRegions(countryCode?: string) {
  if (!countryCode) return [];

  try {
    const holidays = new Holidays(countryCode);
    const regions = holidays.getStates(countryCode.toLowerCase());

    if (!regions || !Object.values(regions).length) return [];

    return regionDTO.create({ raw: regions }).sort((a, b) => a.label.localeCompare(b.label));
  } catch (error) {
    logger.logError('Error in getRegions', error, { countryCode });
    return [];
  }
}

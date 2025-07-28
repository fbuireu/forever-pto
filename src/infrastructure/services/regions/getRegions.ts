import { regionDTO } from '@application/dto/region/dto';
import Holidays from 'date-holidays';

export function getRegions(countryCode?: string) {
  try {
    if (!countryCode) return [];

    const holidays = new Holidays(countryCode);
    const regions = holidays.getStates(countryCode.toLowerCase());

    if (!regions || !Object.values(regions).length) return [];

    return regionDTO.create({ raw: regions }).sort((a, b) => a.label.localeCompare(b.label));
  } catch (_) {
    return [];
  }
}

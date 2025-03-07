import Holidays from 'date-holidays';
import { regionDTO } from '@/application/dto/region/regionDTO';

export async function getRegions(countryCode?: string){
    try {
      if (!countryCode) return [];

      const holidays = new Holidays(countryCode);
      const regions = holidays.getStates(countryCode.toLowerCase());

      if (!regions || !Object.values(regions).length) return [];

      return regionDTO.create({ raw: regions }).sort((a, b) => a.label.localeCompare(b.label))
    } catch (error) {
      console.error(`Error en servicio de regiones para país ${countryCode}:`, error);
      return [];
    }
  }

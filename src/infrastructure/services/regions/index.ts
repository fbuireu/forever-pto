import Holidays from 'date-holidays';
import { cache } from 'react';

export const getRegions = cache(async (countryCode: string) => {
  try {
    if (!countryCode) return [];

    const hd = new Holidays(countryCode);
    const states = hd.getStates(countryCode.toLowerCase());

    if (!states || Object.keys(states).length === 0) return [];

    // transformer
    return Object.entries(states)
      .map(([regionCode, regionName]) => {
        return {
          value: regionCode,
          label: String(regionName),
        };
      })
      .sort((a, b) => a.label.localeCompare(b.label));
  } catch (error) {
    console.error(`Error en servicio de regiones para país ${countryCode}:`, error);
    return [];
  }
});

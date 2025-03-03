import Holidays from 'date-holidays';
import countries from 'i18n-iso-countries';
import { cache } from 'react';

function getFlagEmoji(countryCode: string) {
  if (!countryCode) return '';
  return countryCode.toUpperCase().replace(/./g, (char) => String.fromCodePoint(127397 + char.charCodeAt(0)));
}

export const getCountries = cache(async (lang = 'en') => {
  try {
    return Object.entries(countries.getNames(lang))
      .map(([code, name]) => ({
        value: code,
        label: name,
        flag: getFlagEmoji(code),
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  } catch (error) {
    console.error('Error en servicio de países:', error);
    return [];
  }
});
export const getRegions = cache(async (countryCode: string) => {
  try {
    if (!countryCode) return [];

    const hd = new Holidays(countryCode);
    const states = hd.getStates(countryCode.toLowerCase());

    if (!states || Object.keys(states).length === 0) return [];

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

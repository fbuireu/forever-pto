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

export const detectCountryFromIP = cache(async () => {
  try {
    const ipResponse = await fetch('https://api.ipify.org?format=json', {
      cache: 'no-store',
    });

    if (!ipResponse.ok) {
      throw new Error('No se pudo obtener la IP del cliente');
    }

    const { ip } = await ipResponse.json();

    const geoResponse = await fetch(`https://ipinfo.io/${ip}/json`, {
      headers: {
        Accept: 'application/json',
      },
      cache: 'no-store',
    });

    if (!geoResponse.ok) {
      throw new Error('No se pudieron obtener datos geográficos');
    }

    const geoData = await geoResponse.json();
    return geoData.country?.toLowerCase() || '';
  } catch (error) {}
});
// method 2 to get location and region: https://stretchmytimeoff.com/cdn-cgi/trace

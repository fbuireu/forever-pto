import countries from 'i18n-iso-countries';
import { cache } from 'react';

function getFlagEmoji(countryCode: string) {
  if (!countryCode) return '';
  return countryCode.toUpperCase().replace(/./g, (char) => String.fromCodePoint(127397 + char.charCodeAt(0)));
}

export const getCountries = cache(async (lang = 'en') => {
  try {
    // transformer
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
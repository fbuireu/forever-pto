import { countryDTO } from '@application/dto/country/dto';
import type { CountryDTO } from '@application/dto/country/types';
import { getBetterStackInstance } from '@infrastructure/clients/logging/better-stack/client';
import countries, { type LocaleData } from 'i18n-iso-countries';
import caLocale from 'i18n-iso-countries/langs/ca.json';
import deLocale from 'i18n-iso-countries/langs/de.json';
import enLocale from 'i18n-iso-countries/langs/en.json';
import esLocale from 'i18n-iso-countries/langs/es.json';
import frLocale from 'i18n-iso-countries/langs/fr.json';
import itLocale from 'i18n-iso-countries/langs/it.json';
import type { Locale } from 'next-intl';

const logger = getBetterStackInstance();

const localeData = new Map<string, LocaleData>(
  [caLocale, deLocale, enLocale, esLocale, frLocale, itLocale].map((data) => [data.locale, data])
);

for (const data of localeData.values()) {
  countries.registerLocale(data);
}

export function getCountries(locale: Locale): CountryDTO[] {
  try {
    return countryDTO.create({ raw: countries.getNames(locale) }).sort((a, b) => a.label.localeCompare(b.label));
  } catch (error) {
    logger.logError('Error in getCountries', error, { locale });
    return [];
  }
}

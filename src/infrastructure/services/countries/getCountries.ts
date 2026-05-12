import { countryDTO } from '@application/dto/country/dto';
import type { CountryDTO } from '@application/dto/country/types';
import { getBetterStackInstance } from '@infrastructure/clients/logging/better-stack/client';
import countries, { type LocaleData } from 'i18n-iso-countries';

const logger = getBetterStackInstance();

import type { Locale } from 'next-intl';

const localeDataLoaders: Record<string, () => Promise<{ default: LocaleData }>> = {
  ca: () => import('i18n-iso-countries/langs/ca.json'),
  it: () => import('i18n-iso-countries/langs/it.json'),
  en: () => import('i18n-iso-countries/langs/en.json'),
  es: () => import('i18n-iso-countries/langs/es.json'),
  fr: () => import('i18n-iso-countries/langs/fr.json'),
  de: () => import('i18n-iso-countries/langs/de.json'),
};

export async function getCountries(locale: Locale): Promise<CountryDTO[]> {
  try {
    const loader = localeDataLoaders[locale as string] ?? localeDataLoaders.en;
    const localeData = await loader();
    countries.registerLocale(localeData.default);
    return countryDTO.create({ raw: countries.getNames(locale) }).sort((a, b) => a.label.localeCompare(b.label));
  } catch (error) {
    logger.logError('Error in getCountries', error, { locale });
    return [];
  }
}

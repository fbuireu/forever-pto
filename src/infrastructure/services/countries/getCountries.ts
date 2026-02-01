import { countryDTO } from '@application/dto/country/dto';
import type { CountryDTO } from '@application/dto/country/types';
import type { CountryService } from '@application/interfaces/location-services';
import countries from 'i18n-iso-countries';
import type { Locale } from 'next-intl';
import type { Logger } from '@domain/shared/types';

export async function getCountries(locale: Locale, logger: Logger): Promise<CountryDTO[]> {
  try {
    const localeData = await import(`i18n-iso-countries/langs/${locale}.json`);
    countries.registerLocale(localeData);
    return countryDTO.create({ raw: countries.getNames(locale) }).sort((a, b) => a.label.localeCompare(b.label));
  } catch (error) {
    logger.logError('Error in getCountries', error, { locale });
    return [];
  }
}

export const createCountryService = (logger: Logger): CountryService => ({
  getCountries: (locale: Locale) => getCountries(locale, logger),
});

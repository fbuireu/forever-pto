import { countryDTO } from '@application/dto/country/dto';
import type { CountryDTO } from '@application/dto/country/types';
import countries from 'i18n-iso-countries';
import type { Locale } from 'next-intl';

export async function getCountries(locale: Locale): Promise<CountryDTO[]> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    countries.registerLocale(require(`i18n-iso-countries/langs/${locale}.json`));
    return countryDTO.create({ raw: countries.getNames(locale) }).sort((a, b) => a.label.localeCompare(b.label));
  } catch (error) {
    console.warn('Error in getCountries:', error);
    return [];
  }
}

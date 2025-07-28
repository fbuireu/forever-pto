import { countryDTO } from '@application/dto/country/dto';
import { CountryDTO } from '@application/dto/country/types';
import countries from 'i18n-iso-countries';
import { Locale } from 'next-intl';

export async function getCountries(locale: Locale): Promise<CountryDTO[]> {
  try {
    countries.registerLocale(require(`i18n-iso-countries/langs/${locale}.json`));
    return countryDTO.create({ raw: countries.getNames(locale) }).sort((a, b) => a.label.localeCompare(b.label));
  } catch (_) {
    return [];
  }
}

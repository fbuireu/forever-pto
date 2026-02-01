import type { CountryService } from '@application/interfaces/location-services';
import type { CountryDTO } from '@application/dto/country/types';
import type { Locale } from 'next-intl';

export interface FetchCountriesDependencies {
  countryService: CountryService;
}

export const fetchCountries = async (
  locale: Locale,
  deps: FetchCountriesDependencies
): Promise<CountryDTO[]> => {
  return deps.countryService.getCountries(locale);
};

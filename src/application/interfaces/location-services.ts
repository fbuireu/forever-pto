import type { CountryDTO } from '@application/dto/country/types';
import type { RegionDTO } from '@application/dto/region/types';
import type { Locale } from 'next-intl';

export interface CountryService {
  getCountries(locale: Locale): Promise<CountryDTO[]>;
}

export interface RegionService {
  getRegions(countryCode?: string): RegionDTO[];
}

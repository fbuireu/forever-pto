import { LocalizedCountryNames } from 'i18n-iso-countries';
import type { CountryDTO } from '@/application/dto/country/types';
import type { Except } from '@/const/types';

export type RawRegion = LocalizedCountryNames<{select: "official"}>

export type RegionDTO = Except<CountryDTO, 'flag'>



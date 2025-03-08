import { countryDTO } from '@/application/dto/country/countryDTO';
import type { CountryDTO } from '@/application/dto/country/types';
import { getUserLanguage } from '@/shared/infrastructure/services/utils/getUserLanguage';
import countries from 'i18n-iso-countries';

export function getCountries(): CountryDTO[] {
  try {
    const [userLanguage] = getUserLanguage();

    return countryDTO.create({ raw: countries.getNames(userLanguage) }).sort((a, b) => a.label.localeCompare(b.label));
  } catch (error) {
    return [];
  }
}

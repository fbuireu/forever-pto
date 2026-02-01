import { getCountries } from '@infrastructure/services/countries/getCountries';
import { getBetterStackInstance } from '@infrastructure/clients/logging/better-stack/client';
import type { Locale } from 'next-intl';
import { CountriesClient } from './CountriesClient';

interface CountriesProps {
  locale: Locale;
}

export const Countries = async ({ locale }: CountriesProps) => {
  const logger = getBetterStackInstance();
  const countries = await getCountries(locale, logger);

  return <CountriesClient countries={countries} />;
};

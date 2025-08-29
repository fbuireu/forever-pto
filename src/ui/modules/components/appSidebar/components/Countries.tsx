import { getCountries } from '@infrastructure/services/countries/getCountries';
import type { Locale } from 'next-intl';
import { CountriesClient } from './CountriesClient';

interface CountriesProps {
  locale: Locale;
}

export const Countries = async ({ locale }: CountriesProps) => {
  const countries = await getCountries(locale);

  return <CountriesClient countries={countries} />;
};

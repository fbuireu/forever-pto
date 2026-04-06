import { getCountries } from '@infrastructure/services/countries/getCountries';
import type { Locale } from 'next-intl';
import dynamic from 'next/dynamic';

const CountriesClient = dynamic(() => import('./CountriesClient').then((m) => m.CountriesClient));

interface CountriesProps {
  locale: Locale;
}

export const Countries = async ({ locale }: CountriesProps) => {
  const countries = await getCountries(locale);

  return <CountriesClient countries={countries} />;
};

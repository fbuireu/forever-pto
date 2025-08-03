'use client';

import { useLocationState } from '@application/stores/location';
import { usePtoState } from '@application/stores/pto';
import { Combobox } from '@const/components/ui/combobox';
import { Field, Label } from '@headlessui/react';
import { MapPin } from 'lucide-react';
import type { Locale } from 'next-intl';
import { useEffect } from 'react';

interface CountriesProps {
  locale: Locale;
}

export const Countries = ({ locale }: CountriesProps) => {
  const { country, setCountry } = usePtoState();
  const { countries, countriesLoading } = useLocationState();
  const { fetchCountries } = useLocationState();

  useEffect(() => {
    if (!locale) return;
    fetchCountries(locale);
  }, [fetchCountries, locale]);

  return (
    <Field className='space-y-2 w-full'>
      <Label className='flex gap-2 my-2 text-sm font-normal' htmlFor='countries'>
        <MapPin size={16} /> Country
      </Label>
      <Combobox
        className='w-full'
        id='countries'
        options={countries}
        value={country}
        onChange={setCountry}
        placeholder={countriesLoading ? 'Loading countries...' : 'Select country...'}
        searchPlaceholder='Search countries...'
      />
    </Field>
  );
};

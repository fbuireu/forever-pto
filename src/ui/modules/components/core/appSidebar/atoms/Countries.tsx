'use client';

import { useCountries, useCountriesLoading } from '@application/stores/location';
import { useCountry, useSetCountry } from '@application/stores/pto';
import { Combobox } from '@const/components/ui/combobox';
import { Field, Label } from '@headlessui/react';
import { MapPin } from 'lucide-react';

export const Countries = () => {
  const countries = useCountries();
  const countriesLoading = useCountriesLoading();
  const currentCountry = useCountry();
  const setCountry = useSetCountry();

  return (
    <Field className='space-y-2 w-full'>
      <Label className='flex gap-2 my-2 text-sm font-normal' htmlFor='countries'>
        <MapPin size={16} /> Country
      </Label>
      <Combobox
        className='w-full'
        id='countries'
        options={countries}
        value={currentCountry}
        onChange={setCountry}
        placeholder={countriesLoading ? 'Loading countries...' : 'Select country...'}
        searchPlaceholder='Search countries...'
      />
    </Field>
  );
};

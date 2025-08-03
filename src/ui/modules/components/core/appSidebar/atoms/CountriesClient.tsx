'use client';

import { CountryDTO } from '@application/dto/country/types';
import { useLocationState } from '@application/stores/location';
import { usePtoState } from '@application/stores/pto';
import { Combobox } from '@const/components/ui/combobox';
import { Field, Label } from '@headlessui/react';
import { MapPin } from 'lucide-react';
import { useEffect } from 'react';

interface CountriesClientProps {
  countries: CountryDTO[];
}

export const CountriesClient = ({ countries }: CountriesClientProps) => {
  const { country, setCountry } = usePtoState();
  const { countriesLoading, setCountries } = useLocationState();

  useEffect(() => {
    if (!countries.length) return;
    setCountries(countries);
  }, [countries, setCountries]);

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

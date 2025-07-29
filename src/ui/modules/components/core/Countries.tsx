'use client';

import { useCountries, useCountriesLoading, useGetCountryByCode } from '@application/stores/location';
import { useCountry, useSetCountry } from '@application/stores/pto';
import { Combobox } from '@const/components/ui/combobox';
import { RotatingText } from 'src/components/animate-ui/text/rotating';

export const Countries = () => {
  const countries = useCountries();
  const countriesLoading = useCountriesLoading();
  const currentCountry = useCountry();
  const setCountry = useSetCountry();
  const getCountryByCode = useGetCountryByCode();

  const selectedCountry = getCountryByCode(currentCountry);

  return (
    <div className='space-y-2'>
      <label className='text-sm font-medium'>Country</label>
      <Combobox
        options={countries}
        value={currentCountry}
        onChange={setCountry}
        placeholder={countriesLoading ? 'Loading countries...' : 'Select country...'}
        searchPlaceholder='Search countries...'
      />
      {selectedCountry && (
        <span>
          Selected: <RotatingText text={`${selectedCountry.flag} ${selectedCountry.label}`} />
        </span>
      )}
    </div>
  );
};

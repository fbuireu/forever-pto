'use client';

import type { CountryDTO } from '@application/dto/country/types';
import { useFiltersState } from '@application/stores/filters';
import { useLocationState } from '@application/stores/location';
import { Combobox } from '@const/components/ui/combobox';
import { Field, Label } from '@headlessui/react';
import { MapPin } from 'lucide-react';
import { useEffect } from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from 'src/components/animate-ui/radix/tooltip';
import { InfoIcon } from 'lucide-react';

interface CountriesClientProps {
  countries: CountryDTO[];
}

export const CountriesClient = ({ countries }: CountriesClientProps) => {
  const { country, setCountry } = useFiltersState();
  const { countriesLoading, setCountries } = useLocationState();

  useEffect(() => {
    if (!countries.length) return;
    setCountries(countries);
  }, [countries, setCountries]);

  return (
    <Field className='space-y-2 w-full'>
      <Label className='flex gap-2 my-2 text-sm font-normal' htmlFor='countries'>
        <MapPin size={16} /> Country
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild className='ml-auto'>
              <InfoIcon className='h-4 w-4 text-muted-foreground cursor-help' />
            </TooltipTrigger>
            <TooltipContent className='w-50 text-pretty'>
              This data is inferred from your CDN and your connection. If you feel that  it's not accurate or you want sneak peak into other's countries holidays, you can select it manually here
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
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

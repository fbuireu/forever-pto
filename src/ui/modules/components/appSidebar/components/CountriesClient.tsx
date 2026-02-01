'use client';

import type { CountryDTO } from '@application/dto/country/types';
import { useFiltersStore } from '@ui/store/filters';
import { useLocationStore } from '@ui/store/location';
import { Combobox } from '@const/components/ui/combobox';
import { Field, Label } from '@headlessui/react';
import { InfoIcon } from 'lucide-react';
import { useEffect } from 'react';
import { AnimateIcon } from 'src/components/animate-ui/icons/icon';
import { MapPin } from 'src/components/animate-ui/icons/map-pin';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from 'src/components/animate-ui/radix/tooltip';

interface CountriesClientProps {
  countries: CountryDTO[];
}

export const CountriesClient = ({ countries }: CountriesClientProps) => {
  const country = useFiltersStore((state) => state.country);
  const setCountry = useFiltersStore((state) => state.setCountry);
  const countriesLoading = useLocationStore((state) => state.countriesLoading);
  const setCountries = useLocationStore((state) => state.setCountries);

  useEffect(() => {
    if (!countries.length) return;
    setCountries(countries);
  }, [countries, setCountries]);

  return (
    <AnimateIcon animateOnHover>
      <Field className='space-y-2 w-full' data-tutorial='country'>
        <Label className='flex gap-2 my-2 text-sm font-normal' htmlFor='countries'>
          <MapPin size={16} /> Country
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild className='ml-auto'>
                <InfoIcon className='h-4 w-4 text-muted-foreground cursor-help' />
              </TooltipTrigger>
              <TooltipContent className='w-50 text-pretty'>
                This data is inferred from your CDN and your connection. If you feel that it&apos;s not accurate or you
                want a sneak peek into other countries&apos; holidays, you can select it manually here
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
    </AnimateIcon>
  );
};

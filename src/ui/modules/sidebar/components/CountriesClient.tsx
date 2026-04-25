'use client';

import type { CountryDTO } from '@application/dto/country/types';
import { useFiltersStore } from '@application/stores/filters';
import { useLocationStore } from '@application/stores/location';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@ui/modules/core/animate/base/Tooltip';
import { AnimateIcon } from '@ui/modules/core/animate/icons/Icon';
import { MapPin } from '@ui/modules/core/animate/icons/MapPin';
import { Combobox } from '@ui/modules/core/primitives/Combobox';
import { InfoIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect } from 'react';

interface CountriesClientProps {
  countries: CountryDTO[];
}

export const CountriesClient = ({ countries }: CountriesClientProps) => {
  const t = useTranslations('sidebar.country');
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
      <div className='space-y-2 w-full' data-tutorial='country'>
        <label className='flex gap-2 my-2 text-sm font-normal' htmlFor='countries'>
          <MapPin size={16} /> {t('title')}
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger aria-label={t('tooltipLabel')} className='ml-auto cursor-help'>
                <InfoIcon className='h-4 w-4 text-muted-foreground' aria-hidden='true' />
              </TooltipTrigger>
              <TooltipContent className='w-50 text-pretty'>{t('tooltip')}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </label>
        <Combobox
          className='w-full'
          id='countries'
          options={countries}
          value={country}
          onChange={setCountry}
          placeholder={countriesLoading ? t('loading') : t('placeholder')}
          searchPlaceholder={t('search')}
        />
      </div>
    </AnimateIcon>
  );
};

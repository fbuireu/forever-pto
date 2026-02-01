'use client';

import { useFiltersStore } from '@ui/store/filters';
import { useLocationStore } from '@ui/store/location';
import { Combobox } from '@const/components/ui/combobox';
import { Field, Label } from '@headlessui/react';
import { MapPinned } from 'lucide-react';
import { useEffect } from 'react';

export const Regions = () => {
  const regions = useLocationStore((state) => state.regions);
  const regionsLoading = useLocationStore((state) => state.regionsLoading);
  const fetchRegions = useLocationStore((state) => state.fetchRegions);

  const country = useFiltersStore((state) => state.country);
  const region = useFiltersStore((state) => state.region);
  const setRegion = useFiltersStore((state) => state.setRegion);

  useEffect(() => {
    if (!country) return;
    fetchRegions(country);
  }, [country, fetchRegions]);

  return (
    <Field className='space-y-2 w-full' data-tutorial='region'>
      <Label className='flex gap-2 my-2 text-sm font-normal' htmlFor='regions'>
        <MapPinned size={16} /> Region
      </Label>
      <Combobox
        className='w-full'
        id='regions'
        options={regions}
        value={region}
        onChange={setRegion}
        disabled={!country}
        placeholder={regionsLoading ? 'Loading regions...' : 'Select region...'}
        searchPlaceholder='Search regions...'
      />
    </Field>
  );
};

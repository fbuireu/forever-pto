'use client';

import { useFetchRegions, useRegions, useRegionsLoading } from '@application/stores/location';
import { useCountry, useRegion, useSetRegion } from '@application/stores/pto';
import { Combobox } from '@const/components/ui/combobox';
import { Field, Label } from '@headlessui/react';
import { MapPinned } from 'lucide-react';
import { useEffect } from 'react';

export const Regions = () => {
  const country = useCountry();
  const regions = useRegions();
  const regionsLoading = useRegionsLoading();
  const currentRegion = useRegion();
  const setRegion = useSetRegion();
  const fetchRegions = useFetchRegions();

  useEffect(() => {
    if (!country) return;

    fetchRegions(country);
  }, [country, fetchRegions]);

  return (
    <Field className='space-y-2'>
      <Label className='flex gap-2 my-2 text-sm font-normal' htmlFor='regions'>
        <MapPinned size={16} /> Region
      </Label>
      <Combobox
        id='regions'
        options={regions}
        value={currentRegion}
        onChange={setRegion}
        disabled={!country}
        placeholder={regionsLoading ? 'Loading regions...' : 'Select region...'}
        searchPlaceholder='Search regions. ..'
      />
    </Field>
  );
};

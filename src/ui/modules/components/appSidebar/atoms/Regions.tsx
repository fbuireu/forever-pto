'use client';

import { useLocationState } from '@application/stores/location';
import { usePtoState } from '@application/stores/pto';
import { Combobox } from '@const/components/ui/combobox';
import { Field, Label } from '@headlessui/react';
import { MapPinned } from 'lucide-react';
import { useEffect } from 'react';

export const Regions = () => {
  const { regions, regionsLoading, fetchRegions } = useLocationState();
  const { country, region, setRegion } = usePtoState();

  useEffect(() => {
    if (!country) return;

    fetchRegions(country);
  }, [country, fetchRegions]);

  return (
    <Field className='space-y-2 w-full'>
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
        searchPlaceholder='Search regions. ..'
      />
    </Field>
  );
};

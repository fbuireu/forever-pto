'use client';

import { useFiltersStore } from '@application/stores/filters';
import { useLocationStore } from '@application/stores/location';
import { Combobox } from '@const/components/ui/combobox';
import { Field, Label } from '@headlessui/react';
import { MapPinned } from 'lucide-react';
import { useEffect } from 'react';
import { useShallow } from 'zustand/react/shallow';

export const Regions = () => {
const { regions, regionsLoading, fetchRegions } = useLocationStore(
  useShallow((state) => ({
    regions: state.regions,
    regionsLoading: state.regionsLoading,
    fetchRegions: state.fetchRegions,
  }))
);

const { country, region, setRegion } = useFiltersStore(
  useShallow((state) => ({
    country: state.country,
    region: state.region,
    setRegion: state.setRegion,
  }))
);

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

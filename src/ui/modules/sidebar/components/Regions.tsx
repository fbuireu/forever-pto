'use client';

import { useFiltersStore } from '@application/stores/filters';
import { useLocationStore } from '@application/stores/location';
import { Combobox } from '@ui/modules/core/primitives/Combobox';
import { MapPinned } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect } from 'react';

export const Regions = () => {
  const t = useTranslations('sidebar.region');
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
    <div className='space-y-2 w-full' data-tutorial='region'>
      <label className='flex gap-2 my-2 text-sm font-normal' htmlFor='regions'>
        <MapPinned size={16} /> {t('title')}
      </label>
      <Combobox
        className='w-full'
        id='regions'
        options={regions}
        value={region}
        onChange={setRegion}
        disabled={!country}
        placeholder={regionsLoading ? t('loading') : t('placeholder')}
        searchPlaceholder={t('search')}
      />
    </div>
  );
};

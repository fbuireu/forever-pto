'use client';

import { useCurrentCountryCode, useFetchRegions, useGetRegion, useRegions, useRegionsLoading } from '@application/stores/location';
import { useCountry, useRegion, useSetRegion } from '@application/stores/pto';
import { Combobox } from '@const/components/ui/combobox';
import { useEffect } from 'react';
import { RotatingText } from 'src/components/animate-ui/text/rotating';

export const Regions = () => {
  const country = useCountry();
  const regions = useRegions(); 
  const currentCountryCode = useCurrentCountryCode(); 
  const regionsLoading = useRegionsLoading();
  const currentRegion = useRegion();
  const setRegion = useSetRegion();
  const getRegion = useGetRegion();
  const fetchRegions = useFetchRegions();

  useEffect(() => {
    if(!country) return;

    fetchRegions(country);
  }, [country, fetchRegions]);

  const availableRegions = currentCountryCode === country ? regions : [];

  const selectedRegion = getRegion(country, currentRegion);

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Region</label>
      <Combobox
        options={availableRegions}
        value={currentRegion}
        onChange={setRegion}
        disabled={!country}
        placeholder={regionsLoading ? "Loading regions..." : "Select region..."}
        searchPlaceholder="Search regions..."
      />
      {selectedRegion && (
          <span>Selected: <RotatingText text={`${selectedRegion.label}`} /></span>
      )}
    </div>
  );
};
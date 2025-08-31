'use client';

import { useFiltersStore } from '@application/stores/filters';
import { useStoresReady } from '@ui/hooks/useStoresReady';
import { useEffect } from 'react';

interface StoreInitializerProps {
  userCountry?: string;
}

export const StoresInitializer = ({ userCountry }: StoreInitializerProps) => {
  const { isReady } = useStoresReady();
  const { country, setCountry } = useFiltersStore();

  useEffect(() => {
    if (!isReady || !userCountry) return;

    if (!country) {
      setCountry(userCountry);
    }
  }, [isReady, userCountry, country, setCountry]);

  return null;
};

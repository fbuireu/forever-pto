'use client';

import { useFiltersStore } from '@application/stores/filters';
import { useStoresReady } from '@ui/hooks/useStoresReady';
import { useEffect } from 'react';
import { useShallow } from 'zustand/react/shallow';

interface StoreInitializerProps {
  userCountry?: string;
}

export const StoresInitializer = ({ userCountry }: StoreInitializerProps) => {
  const { areStoresReady } = useStoresReady();
  const { country, setCountry } = useFiltersStore(
    useShallow((state) => ({
      country: state.country,
      setCountry: state.setCountry,
    }))
  );

  useEffect(() => {
    if (!userCountry || country) return;
    setCountry(userCountry);
  }, [areStoresReady, userCountry, country, setCountry]);

  return null;
};

'use client';

import { useFiltersStore } from '@application/stores/filters';
import { useStoresReady } from '@ui/hooks/useStoresReady';
import { useEffect } from 'react';
import { useShallow } from 'zustand/react/shallow';

function getUserCountryFromCookie(): string | undefined {
  if (typeof document === 'undefined') return undefined;
  const cookie = document.cookie.split('; ').find((row) => row.startsWith('user-country='));
  return cookie?.split('=')[1];
}

export const StoresInitializer = () => {
  const { areStoresReady } = useStoresReady();
  const userCountry = getUserCountryFromCookie();
  const { country, setCountry } = useFiltersStore(
    useShallow((state) => ({
      country: state.country,
      setCountry: state.setCountry,
    }))
  );

  useEffect(() => {
    if (!areStoresReady || country) return;
    if (userCountry) {
      setCountry(userCountry);
    }
  }, [areStoresReady, country, setCountry, userCountry]);

  return null;
};

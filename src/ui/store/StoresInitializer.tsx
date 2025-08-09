'use client';

import { usePtoStore } from '@application/stores/pto';
import { useStoresReady } from '@ui/hooks/useStoresReady';
import type { Locale } from 'next-intl';
import { useEffect } from 'react';

interface StoreInitializerProps {
  userCountry?: string;
  locale: Locale;
}

export const StoresInitializer = ({ userCountry, locale }: StoreInitializerProps) => {
  const {isReady} = useStoresReady();
  const { country, setCountry } = usePtoStore();

  useEffect(() => {
    if (!isReady || !userCountry) return;

    if (!country) {
      setCountry(userCountry);
    }
  }, [isReady, userCountry, country, setCountry]);

  return null;
};

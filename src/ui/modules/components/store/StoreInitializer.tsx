'use client';

import { useFetchCountries } from '@application/stores/location';
import { useCountry, usePtoStore, useUpdateStore } from '@application/stores/pto';
import { Locale } from 'next-intl';
import { useEffect, useState } from 'react';

interface StoreInitializerProps {
  userCountry?: string;
  locale: Locale;
}

export const StoreInitializer = ({ userCountry, locale }: StoreInitializerProps) => {
  const updateStore = useUpdateStore();
  const fetchCountries = useFetchCountries();
  const currentCountry = useCountry();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const unsubscribe = usePtoStore.persist.onHydrate(() => {
      setHydrated(false);
    });
    
    const unsubscribeFinish = usePtoStore.persist.onFinishHydration(() => {
      setHydrated(true);
    });

    return () => {
      unsubscribe();
      unsubscribeFinish();
    };
  }, []);

  useEffect(() => {
    if(!locale) return;
    fetchCountries(locale);
  }, [fetchCountries, locale]);

  useEffect(() => {
    if (!hydrated) return;
    
    if (!currentCountry && userCountry) {
      updateStore({ country: userCountry });
    }
  }, [hydrated, currentCountry, userCountry, updateStore]);

  return null; 
};
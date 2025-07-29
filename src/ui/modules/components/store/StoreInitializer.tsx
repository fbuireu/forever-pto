'use client';

import { useFetchCountries } from '@application/stores/location';
import { useCountry, usePtoStore, useUpdateStore } from '@application/stores/pto';
import { Locale } from 'next-intl';
import { useEffect } from 'react';

interface StoreInitializerProps {
  userCountry?: string;
  locale: Locale;
}

export const StoreInitializer = ({ userCountry, locale }: StoreInitializerProps) => {
  const updateStore = useUpdateStore();
  const fetchCountries = useFetchCountries();
  const currentCountry = useCountry();

  useEffect(() => {
    const unsubscribeEnd = usePtoStore.persist.onFinishHydration(() => {
      if (currentCountry || !userCountry) return;

      updateStore({ country: userCountry });
    });

    return unsubscribeEnd;
  }, [currentCountry, userCountry, updateStore]);

  useEffect(() => {
    if (!locale) return;

    fetchCountries(locale);
  }, [fetchCountries, locale]);

  return null;
};

'use client';

import { useFetchHolidays } from '@application/stores/holidays';
import { useLocationState } from '@application/stores/location';
import { usePtoState, usePtoStore } from '@application/stores/pto';
import { Locale } from 'next-intl';
import { useEffect } from 'react';

interface StoreInitializerProps {
  userCountry?: string;
  locale: Locale;
}

export const StoresInitializer = ({ userCountry, locale }: StoreInitializerProps) => {
  const { country, region, year, carryOverMonths, updateStore } = usePtoState();
  const { fetchCountries } = useLocationState();
  const fetchHolidays = useFetchHolidays();

  useEffect(() => {
    const unsubscribeEnd = usePtoStore.persist.onFinishHydration((hydratedState) => {
      if (hydratedState?.country || !userCountry) return;
      updateStore({ country: userCountry });
    });

    return unsubscribeEnd;
  }, [userCountry, updateStore]);

  useEffect(() => {
    if (!locale) return;
    fetchCountries(locale);
  }, [fetchCountries, locale]);

  useEffect(() => {
    if (!country) return;
    fetchHolidays({ year, region, country, locale, carryOverMonths });
  }, [fetchHolidays, year, region, country, carryOverMonths, locale]);

  return null;
};

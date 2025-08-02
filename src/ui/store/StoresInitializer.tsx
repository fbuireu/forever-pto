'use client';

import { useFetchHolidays } from '@application/stores/holidays';
import { useLocationState } from '@application/stores/location';
import { usePtoState, usePtoStore } from '@application/stores/pto';
import { Locale } from 'next-intl';
import { useEffect, useState } from 'react';

interface StoreInitializerProps {
  userCountry?: string;
  locale: Locale;
}

export const StoresInitializer = ({ userCountry, locale }: StoreInitializerProps) => {
  const [ptoStoreHydrated, setPtoStoreHydrated] = useState(false);
  const { country, region, year, carryOverMonths, updateStore } = usePtoState();
  const { fetchCountries } = useLocationState();
  const fetchHolidays = useFetchHolidays();

  useEffect(() => {
    const unsubscribeStart = usePtoStore.persist.onHydrate(() => setPtoStoreHydrated(false));
    const unsubscribeEnd = usePtoStore.persist.onFinishHydration(() => setPtoStoreHydrated(true));

    if (usePtoStore.persist.hasHydrated()) {
      setPtoStoreHydrated(true);
    }

    return () => {
      unsubscribeStart();
      unsubscribeEnd();
    };
  }, []);

  useEffect(() => {
    if (!ptoStoreHydrated || !userCountry || country) return;

    updateStore({ country: userCountry });
  }, [ptoStoreHydrated, country, userCountry, updateStore]);

  useEffect(() => {
    if (!locale) return;
    fetchCountries(locale);
  }, [fetchCountries, locale]);

  useEffect(() => {
    if (!ptoStoreHydrated || !country) return;
    fetchHolidays({ year, region, country, locale, carryOverMonths });
  }, [ptoStoreHydrated, fetchHolidays, year, region, country, carryOverMonths, locale]);

  return null;
};

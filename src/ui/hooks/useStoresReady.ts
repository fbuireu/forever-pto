import { useFiltersStore } from '@application/stores/filters';
import { useHolidaysStore } from '@application/stores/holidays';
import { useLocationStore } from '@application/stores/location';
import { usePremiumStore } from '@application/stores/premium';
import { useEffect, useState } from 'react';

const STORES = [
  { name: 'filters', store: useFiltersStore },
  { name: 'holidays', store: useHolidaysStore },
  { name: 'location', store: useLocationStore },
  { name: 'premium', store: usePremiumStore },
] as const;

export const useStoresReady = () => {
  const [hydrationStatus, setHydrationStatus] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const initialStatus = Object.fromEntries(
      STORES.map(({ name, store }) => {
        const hasHydrated = store.persist.hasHydrated();
        return [name, hasHydrated];
      })
    );

    setHydrationStatus(initialStatus);

    if (Object.values(initialStatus).every(Boolean)) {
      return;
    }

    const unsubscribes = STORES.filter(({ name }) => !initialStatus[name]).map(({ name, store }) => {
      return store.persist.onFinishHydration(() => {
        setHydrationStatus((prev) => ({
          ...prev,
          [name]: true,
        }));
      });
    });

    return () => {
      unsubscribes.forEach((unsubscribe) => unsubscribe());
    };
  }, []);

  const hasAllStores = STORES.every(({ name }) => name in hydrationStatus);
  const allStoresHydrated = Object.values(hydrationStatus).every(Boolean);
  const areStoresReady = hasAllStores && allStoresHydrated;

  return {
    areStoresReady,
    hydrationStatus,
  };
};

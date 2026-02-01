import { useFiltersStore } from '@ui/store/filters';
import { useHolidaysStore } from '@ui/store/holidays';
import { useLocationStore } from '@ui/store/location';
import { usePremiumStore } from '@ui/store/premium';
import { useEffect, useMemo, useState } from 'react';

const STORES = [
  { name: 'filters', store: useFiltersStore },
  { name: 'holidays', store: useHolidaysStore },
  { name: 'location', store: useLocationStore },
  { name: 'premium', store: usePremiumStore },
] as const;

export const useStoresReady = () => {
  const [hydrationStatus, setHydrationStatus] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(STORES.map(({ name, store }) => [name, store.persist.hasHydrated()]))
  );

  useEffect(() => {
    if (Object.values(hydrationStatus).every(Boolean)) {
      return;
    }

    const unsubscribes = STORES.filter(({ name }) => !hydrationStatus[name]).map(({ name, store }) =>
      store.persist.onFinishHydration(() => {
        setHydrationStatus((prev) => ({
          ...prev,
          [name]: true,
        }));
      })
    );

    return () => {
      unsubscribes.forEach((unsubscribe) => unsubscribe());
    };
  }, []);

  const areStoresReady = useMemo(() => Object.values(hydrationStatus).every(Boolean), [hydrationStatus]);

  return {
    areStoresReady,
    hydrationStatus,
  };
};

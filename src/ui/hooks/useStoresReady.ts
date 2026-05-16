import { useFiltersStore } from '@application/stores/filters';
import { useHolidaysStore } from '@application/stores/holidays';
import { useLocationStore } from '@application/stores/location';
import { usePremiumStore } from '@application/stores/premium';
import { useEffect, useMemo, useState } from 'react';

const PERSISTED_STORES = [
  { name: 'filters', store: useFiltersStore },
  { name: 'holidays', store: useHolidaysStore },
  { name: 'location', store: useLocationStore },
  { name: 'premium', store: usePremiumStore },
] as const;

export const useStoresReady = () => {
  const [hydrationStatus, setHydrationStatus] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(PERSISTED_STORES.map(({ name, store }) => [name, store.persist.hasHydrated()]))
  );

  useEffect(() => {
    if (Object.values(hydrationStatus).every(Boolean)) {
      return;
    }

    const unsubscribes = PERSISTED_STORES.reduce<(() => void)[]>((acc, { name, store }) => {
      if (!hydrationStatus[name]) {
        acc.push(
          store.persist.onFinishHydration(() => {
            setHydrationStatus((prev) => ({ ...prev, [name]: true }));
          })
        );
      }
      return acc;
    }, []);

    return () => {
      unsubscribes.forEach((unsubscribe) => {
        unsubscribe();
      });
    };
  }, [hydrationStatus]);

  const areStoresReady = useMemo(() => Object.values(hydrationStatus).every(Boolean), [hydrationStatus]);

  return {
    areStoresReady,
    hydrationStatus,
  };
};

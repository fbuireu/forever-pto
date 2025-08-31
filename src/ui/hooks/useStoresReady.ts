import { useFiltersStore } from '@application/stores/filters';
import { useHolidaysStore } from '@application/stores/holidays';
import { useLocationStore } from '@application/stores/location';
import { useEffect, useState, useRef } from 'react';

export const useStoresReady = () => {
  const [hydrationStatus, setHydrationStatus] = useState<Record<string, boolean>>({
    filters: false,
    holidays: false,
    location: false,
  });
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const stores = [
      { name: 'filters', store: useFiltersStore },
      { name: 'holidays', store: useHolidaysStore },
      { name: 'location', store: useLocationStore },
    ];

    const initialStatus: Record<string, boolean> = {};
    stores.forEach(({ name, store }) => {
      initialStatus[name] = store.persist.hasHydrated();
    });
    setHydrationStatus(initialStatus);

    if (Object.values(initialStatus).every(Boolean)) {
      return;
    }

    const unsubscribes = stores.map(({ name, store }) =>
      store.persist.onFinishHydration(() => {
        setHydrationStatus((prev) => {
          const newStatus = {
            ...prev,
            [name]: true,
          };

          if (Object.values(newStatus).every(Boolean)) {
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
              intervalRef.current = null;
            }
          }

          return newStatus;
        });
      })
    );

    intervalRef.current = setInterval(() => {
      const currentStatus: Record<string, boolean> = {};
      let hasChanges = false;

      stores.forEach(({ name, store }) => {
        const isHydrated = store.persist.hasHydrated();
        currentStatus[name] = isHydrated;
        if (!hydrationStatus[name] && isHydrated) {
          hasChanges = true;
        }
      });

      if (hasChanges) {
        setHydrationStatus(currentStatus);
      }

      if (Object.values(currentStatus).every(Boolean)) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      }
    }, 50);

    return () => {
      unsubscribes.forEach((unsubscribe) => unsubscribe());
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isReady = Object.values(hydrationStatus).every(Boolean);

  return {
    isReady,
    hydrationStatus,
  };
};

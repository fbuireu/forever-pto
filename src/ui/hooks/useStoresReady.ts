import { useFiltersStore } from '@application/stores/filters';
import { useHolidaysStore } from '@application/stores/holidays';
import { useLocationStore } from '@application/stores/location';
import { useEffect, useState } from 'react';

export const useStoresReady = () => {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const stores = [useFiltersStore, useHolidaysStore, useLocationStore];

    const checkAllReady = () => stores.every((store) => store.persist.hasHydrated());

    if (checkAllReady()) {
      setIsReady(true);
      return;
    }

    const unsubscribes = stores.map((store) =>
      store.persist.onFinishHydration(() => {
        setIsReady(checkAllReady());
      })
    );

    return () => unsubscribes.forEach((unsubscribe) => unsubscribe());
  }, []);

  return { isReady };
};

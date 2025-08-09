import { useHolidaysStore } from '@application/stores/holidays';
import { useLocationStore } from '@application/stores/location';
import { usePtoStore } from '@application/stores/pto';
import { useEffect, useState } from 'react';

export const useStoresReady = () => {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const stores = [usePtoStore, useHolidaysStore, useLocationStore];

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

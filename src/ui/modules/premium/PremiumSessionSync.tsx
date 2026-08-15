'use client';

import { usePremiumStore } from '@application/stores/premium';
import { useEffect, useRef } from 'react';

export function PremiumSessionSync() {
  const checkExistingSession = usePremiumStore((state) => state.checkExistingSession);
  const hasSynced = useRef(false);

  useEffect(() => {
    if (hasSynced.current) return;
    hasSynced.current = true;

    void checkExistingSession({ force: true });
  }, [checkExistingSession]);

  return null;
}

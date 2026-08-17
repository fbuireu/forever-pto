'use client';

import { useUIStore } from '@application/stores/ui';
import { useLocale } from 'next-intl';
import { useEffect } from 'react';

export const CurrencySync = () => {
  const locale = useLocale();
  const getCurrencyFromLocale = useUIStore((state) => state.getCurrencyFromLocale);

  useEffect(() => {
    getCurrencyFromLocale(locale);
  }, [locale, getCurrencyFromLocale]);

  return null;
};

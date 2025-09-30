'use client';

import { useLocale } from 'next-intl';
import { useEffect } from 'react';
import { run } from 'vanilla-cookieconsent';
import 'vanilla-cookieconsent/dist/cookieconsent.css';
import { cookiesConfig } from '../footer/components/const';

export const CookieConsent = () => {
  const locale = useLocale();
  useEffect(() => {
    run(cookiesConfig(locale));
  }, []);

  return null;
};

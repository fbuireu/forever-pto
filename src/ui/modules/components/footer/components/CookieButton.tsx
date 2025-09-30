'use client';

import { useLocale } from 'next-intl';
import { useTheme } from 'next-themes';
import { useEffect } from 'react';
import { Button } from 'src/components/animate-ui/components/buttons/button';
import { reset, run, showPreferences } from 'vanilla-cookieconsent';
import { cookiesConfig } from './const';
import { updateDarkMode } from './utils/helpers';

export const CookieButton = () => {
  const locale = useLocale();
  const { theme } = useTheme();

  useEffect(() => {
    updateDarkMode(theme);
    run(cookiesConfig(locale));

    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      mediaQuery.addEventListener('change', () => updateDarkMode(theme));

      return () => {
        mediaQuery.removeEventListener('change', () => updateDarkMode(theme));
        reset();
      };
    }

    return () => reset();
  }, [theme, locale]);

  return (
    <Button variant='ghost' onClick={showPreferences}>
      Manage cookies
    </Button>
  );
};

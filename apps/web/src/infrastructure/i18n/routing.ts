import { defineRouting } from 'next-intl/routing';
import { EN, LOCALES } from './locales';

export const routing = defineRouting({
  locales: LOCALES,
  defaultLocale: EN,
  localePrefix: 'as-needed',
  localeCookie: {
    secure: true,
    sameSite: 'lax',
  },
});

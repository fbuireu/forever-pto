import { defineRouting } from 'next-intl/routing';
import { LOCALES } from './locales';

export const routing = defineRouting({
  locales: LOCALES,
  defaultLocale: 'en',
  localePrefix: 'as-needed',
  localeCookie: {
    secure: true,
    sameSite: 'lax',
  },
});

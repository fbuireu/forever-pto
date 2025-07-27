import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['ca', 'it', 'en', 'es'],

  defaultLocale: 'en',
});

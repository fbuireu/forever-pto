import { defineRouting } from 'next-intl/routing';
import { LOCALES } from './config';

export const routing = defineRouting({
  locales: LOCALES,
  defaultLocale: 'en',
});

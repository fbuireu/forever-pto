import { routing } from '@infrastructure/i18n/routing';
import { LOCALES } from './locales';
import { hasLocale } from 'next-intl';
import { getRequestConfig } from 'next-intl/server';

export { LOCALES } from './locales';

export const LOCALE_COOKIE = 'NEXT_LOCALE';

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(LOCALES, requested) ? requested : routing.defaultLocale;

  return {
    locale,
    messages: (await import(`@i18n/messages/${locale}.json`)).default,
  };
});

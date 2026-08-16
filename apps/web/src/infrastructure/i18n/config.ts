import { resolveLocale } from '@infrastructure/i18n/utils/url';
import { getRequestConfig } from 'next-intl/server';

export default getRequestConfig(async ({ requestLocale }) => {
  const locale = resolveLocale(await requestLocale);

  return {
    locale,
    messages: (await import(`@i18n/messages/${locale}.json`)).default,
  };
});

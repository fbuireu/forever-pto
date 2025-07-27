import { I18N_CONFIG } from '@const/const';
import type { Locale } from 'next-intl';
import createMiddleware from 'next-intl/middleware';

const middleware = createMiddleware({
  locales: I18N_CONFIG.LOCALES,
  defaultLocale: I18N_CONFIG.DEFAULT_LOCALE as Locale,
  localePrefix: I18N_CONFIG.LOCALE_PREFIX,
  localeDetection: I18N_CONFIG.LOCALE_DETECTION,
});

export default middleware;

export const config = {
  matcher: ['/', '/(en|es|ca|it)/:path*'],
};

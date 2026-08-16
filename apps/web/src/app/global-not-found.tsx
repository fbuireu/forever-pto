import '@styles/index.css';
import { DOCUMENT_BODY_CLASS } from '@app/fonts';
import { LOCALE_COOKIE, LOCALES } from '@infrastructure/i18n/locales';
import { routing } from '@infrastructure/i18n/routing';
import { localeFromAcceptLanguage, resolveLocale } from '@infrastructure/i18n/utils/url';
import { LazyMotionProvider } from '@ui/modules/core/animate/providers/LazyMotionProvider';
import { SkipToContent } from '@ui/modules/layout/SkipToContent';
import { HtmlLangSync } from '@ui/modules/pages/not-found/HtmlLangSync';
import { NotFoundContent } from '@ui/modules/pages/not-found/NotFoundContent';
import { AppThemeProvider } from '@ui/modules/providers/AppThemeProvider';
import { cookies, headers } from 'next/headers';
import { hasLocale, NextIntlClientProvider } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Suspense } from 'react';

async function detectLocale() {
  const [headersList, cookieStore] = await Promise.all([headers(), cookies()]);

  const intlLocale = headersList.get('x-next-intl-locale');
  if (hasLocale(LOCALES, intlLocale)) return intlLocale;

  const cookieLocale = cookieStore.get(LOCALE_COOKIE)?.value;
  if (hasLocale(LOCALES, cookieLocale)) return cookieLocale;

  return resolveLocale(localeFromAcceptLanguage(headersList.get('accept-language')));
}

const LocalizedNotFound = async () => {
  const locale = await detectLocale();
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'accessibility' });

  return (
    <>
      <HtmlLangSync locale={locale} />
      <SkipToContent label={t('skipToMainContent')} />
      <NextIntlClientProvider>
        <AppThemeProvider>
          <LazyMotionProvider>
            <NotFoundContent locale={locale} />
          </LazyMotionProvider>
        </AppThemeProvider>
      </NextIntlClientProvider>
    </>
  );
};

export default function GlobalNotFound() {
  return (
    <html lang={routing.defaultLocale} suppressHydrationWarning>
      <body className={DOCUMENT_BODY_CLASS}>
        <Suspense fallback={null}>
          <LocalizedNotFound />
        </Suspense>
      </body>
    </html>
  );
}

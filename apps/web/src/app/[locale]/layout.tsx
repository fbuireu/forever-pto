import { LOCALES } from '@infrastructure/i18n/locales';
import { BonesProvider } from '@ui/modules/providers/BonesProvider';
import { CookieConsentClient } from '@ui/modules/shared/cookie-consent/CookieConsentClient';
import { WebMCP } from '@ui/modules/shared/WebMCP';
import type { ReactNode } from 'react';
import '@styles/index.css';
import { DOCUMENT_BODY_CLASS } from '@app/fonts';
import { LazyMotionProvider } from '@ui/modules/core/animate/providers/LazyMotionProvider';
import { SkipToContent } from '@ui/modules/layout/SkipToContent';
import { AppThemeProvider } from '@ui/modules/providers/AppThemeProvider';
import { CurrencySync } from '@ui/modules/stores/CurrencySync';
import { Analytics } from '@ui/modules/tracking/Analytics';
import { BetterStackTracking } from '@ui/modules/tracking/BetterStackTracking';
import { notFound } from 'next/navigation';
import { hasLocale, type Locale, NextIntlClientProvider } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';

interface LayoutProps {
  children: ReactNode;
  params: Promise<{ locale: Locale }>;
}

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

const Layout = async ({ children, params }: Readonly<LayoutProps>) => {
  const { locale } = await params;

  if (!hasLocale(LOCALES, locale)) {
    notFound();
  }
  setRequestLocale(locale);
  const t = await getTranslations('accessibility');

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={DOCUMENT_BODY_CLASS}>
        <SkipToContent label={t('skipToMainContent')} />
        <BonesProvider />
        <NextIntlClientProvider>
          <CurrencySync />
          <AppThemeProvider>
            <LazyMotionProvider>
              {children}
              <CookieConsentClient />
            </LazyMotionProvider>
          </AppThemeProvider>
        </NextIntlClientProvider>
        <WebMCP />
        <Analytics />
        <BetterStackTracking />
      </body>
    </html>
  );
};

export default Layout;

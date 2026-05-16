import { LOCALES } from '@infrastructure/i18n/locales';
import { BonesProvider } from '@ui/modules/providers/BonesProvider';
import { CookieConsentClient } from '@ui/modules/shared/cookie-consent/CookieConsentClient';
import { WebMCP } from '@ui/modules/shared/WebMCP';
import { cn } from '@ui/utils/cn';
import '@styles/index.css';
import { bricolage, instrumentSerif, jetbrainsMono, spaceGrotesk } from '@app/fonts';
import { LazyMotionProvider } from '@ui/modules/core/animate/providers/LazyMotionProvider';
import { AppThemeProvider } from '@ui/modules/providers/AppThemeProvider';
import { Analytics } from '@ui/modules/tutorial/Analytics';
import { BetterStackTracking } from '@ui/modules/tutorial/BetterStackTracking';
import { notFound } from 'next/navigation';
import { hasLocale, type Locale, NextIntlClientProvider } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';

interface LayoutProps {
  children: React.ReactNode;
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
      <body
        className={cn(
          bricolage.variable,
          spaceGrotesk.variable,
          instrumentSerif.variable,
          jetbrainsMono.variable,
          'font-sans antialiased'
        )}
      >
        <a
          href='#main-content'
          className='sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-3 focus:py-1.5 focus:text-sm focus:bg-background focus:text-foreground focus:border focus:rounded-md focus:shadow-sm'
        >
          {t('skipToMainContent')}
        </a>
        <BonesProvider />
        <NextIntlClientProvider>
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

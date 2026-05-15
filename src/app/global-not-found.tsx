import '@styles/index.css';

import { bricolage, instrumentSerif, jetbrainsMono, spaceGrotesk } from '@app/fonts';
import { LOCALE_COOKIE } from '@infrastructure/i18n/config';
import { routing } from '@infrastructure/i18n/routing';
import { LazyMotionProvider } from '@ui/modules/core/animate/providers/LazyMotionProvider';
import { NotFoundContent } from '@ui/modules/pages/not-found/NotFoundContent';
import { cn } from '@ui/utils/utils';
import { type Locale, NextIntlClientProvider } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import { ThemeProvider } from 'next-themes';
import { cookies, headers } from 'next/headers';

async function detectLocale(): Promise<Locale> {
  const [headersList, cookieStore] = await Promise.all([headers(), cookies()]);

  const intlLocale = headersList.get('x-next-intl-locale');
  if (intlLocale && routing.locales.includes(intlLocale)) {
    return intlLocale;
  }

  const cookieLocale = cookieStore.get(LOCALE_COOKIE)?.value;
  if (cookieLocale && routing.locales.includes(cookieLocale)) {
    return cookieLocale;
  }

  const acceptLang = headersList.get('accept-language') ?? '';
  for (const tag of acceptLang.split(',')) {
    const lang = tag.split(';')[0].trim().split('-')[0].toLowerCase();
    if (routing.locales.includes(lang)) return lang;
  }

  return routing.defaultLocale;
}

export default async function GlobalNotFound() {
  const locale = await detectLocale();
  setRequestLocale(locale);

  return (
    <html lang={locale} suppressHydrationWarning>
      <body
        className={cn(
          bricolage.variable,
          spaceGrotesk.variable,
          instrumentSerif.variable,
          jetbrainsMono.variable,
          'font-sans antialiased',
        )}>
        <a
          href='#main-content'
          className='sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-3 focus:py-1.5 focus:text-sm focus:bg-background focus:text-foreground focus:border focus:rounded-md focus:shadow-sm'>
          Skip to main content
        </a>
        <NextIntlClientProvider>
          <ThemeProvider
            attribute='data-theme'
            defaultTheme='light'
            storageKey='theme'
            enableSystem
            disableTransitionOnChange>
            <LazyMotionProvider>
              <NotFoundContent locale={locale} />
            </LazyMotionProvider>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

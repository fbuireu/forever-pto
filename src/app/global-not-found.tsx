import '@styles/index.css';

import { LazyMotionProvider } from '@ui/modules/core/animate/providers/LazyMotionProvider';
import { NotFoundContent } from '@ui/modules/pages/not-found/NotFoundContent';
import { cn } from '@ui/utils/utils';
import { Bricolage_Grotesque, Instrument_Serif, JetBrains_Mono, Space_Grotesk } from 'next/font/google';
import { cookies, headers } from 'next/headers';
import { NextIntlClientProvider } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import { ThemeProvider } from 'next-themes';

const LOCALES = ['en', 'es', 'ca', 'it', 'fr', 'de'] as const;
type Locale = (typeof LOCALES)[number];
const LOCALES_SET = new Set<string>(LOCALES);

async function detectLocale(): Promise<Locale> {
  const [headersList, cookieStore] = await Promise.all([headers(), cookies()]);

  const intlLocale = headersList.get('x-next-intl-locale');
  if (intlLocale && LOCALES_SET.has(intlLocale)) {
    return intlLocale as Locale;
  }

  const cookieLocale = cookieStore.get('NEXT_LOCALE')?.value;
  if (cookieLocale && LOCALES_SET.has(cookieLocale)) {
    return cookieLocale as Locale;
  }

  const acceptLang = headersList.get('accept-language') ?? '';
  for (const tag of acceptLang.split(',')) {
    const lang = tag.split(';')[0].trim().split('-')[0].toLowerCase();
    if (LOCALES_SET.has(lang)) return lang as Locale;
  }

  return 'en';
}

const bricolage = Bricolage_Grotesque({ variable: '--font-bricolage', subsets: ['latin'], display: 'swap' });
const spaceGrotesk = Space_Grotesk({ variable: '--font-space-grotesk', subsets: ['latin'], display: 'swap' });
const instrumentSerif = Instrument_Serif({
  variable: '--font-instrument-serif',
  subsets: ['latin'],
  weight: '400',
  style: ['normal', 'italic'],
  display: 'swap',
});
const jetbrainsMono = JetBrains_Mono({ variable: '--font-jetbrains-mono', subsets: ['latin'], display: 'swap' });

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
          'font-sans antialiased'
        )}
      >
        <a
          href='#main-content'
          className='sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-3 focus:py-1.5 focus:text-sm focus:bg-background focus:text-foreground focus:border focus:rounded-md focus:shadow-sm'
        >
          Skip to main content
        </a>
        <NextIntlClientProvider>
          <ThemeProvider
            attribute='data-theme'
            defaultTheme='system'
            storageKey='theme'
            enableSystem
            disableTransitionOnChange
          >
            <LazyMotionProvider>
              <NotFoundContent locale={locale} />
            </LazyMotionProvider>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

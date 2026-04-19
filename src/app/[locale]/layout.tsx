import { routing } from '@infrastructure/i18n/routing';
import { cn } from '@ui/lib/utils';
import '@styles/index.css';
import { LazyMotionProvider } from '@ui/components/animate/LazyMotionProvider';
import { Analytics } from '@ui/modules/components/core/Analytics';
import { Bricolage_Grotesque, Instrument_Serif, Space_Grotesk } from 'next/font/google';
import { notFound } from 'next/navigation';
import { hasLocale, type Locale, NextIntlClientProvider } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import { ThemeProvider } from 'next-themes';

const bricolage = Bricolage_Grotesque({
  variable: '--font-bricolage',
  subsets: ['latin'],
  weight: ['700', '800'],
  display: 'swap',
});

const spaceGrotesk = Space_Grotesk({
  variable: '--font-space-grotesk',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

const instrumentSerif = Instrument_Serif({
  variable: '--font-instrument-serif',
  subsets: ['latin'],
  weight: '400',
  style: ['normal', 'italic'],
  display: 'swap',
});

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: Locale }>;
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

const Layout = async ({ children, params }: Readonly<LayoutProps>) => {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  setRequestLocale(locale);

  return (
    <html lang={locale} suppressHydrationWarning>
      <body
        className={cn(bricolage.variable, spaceGrotesk.variable, instrumentSerif.variable, 'font-sans antialiased')}
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
            <LazyMotionProvider>{children}</LazyMotionProvider>
          </ThemeProvider>
        </NextIntlClientProvider>
        <Analytics />
      </body>
    </html>
  );
};

export default Layout;

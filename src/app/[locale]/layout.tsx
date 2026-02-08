import { Toaster } from '@const/components/ui/sonner';
import { cn } from '@const/lib/utils';
import { routing } from '@infrastructure/i18n/routing';
import '@styles/index.css';
import { AppSidebar } from '@ui/modules/components/appSidebar/AppSidebar';
import { Analytics } from '@ui/modules/components/core/Analytics';
import { CookieConsent } from '@ui/modules/components/core/CookieConsent';
import { DonateClient } from '@ui/modules/components/core/DonateClient';
import { SiteSubtitle } from '@ui/modules/components/core/SiteSubtitle';
import { SiteTitle } from '@ui/modules/components/core/SiteTitle';
import { Footer } from '@ui/modules/components/footer/Footer';
import { StoresInitializer } from '@ui/store/StoresInitializer';
import { type Locale, NextIntlClientProvider, hasLocale } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import { ThemeProvider } from 'next-themes';
import dynamic from 'next/dynamic';
import { Geist, Geist_Mono } from 'next/font/google';
import { notFound } from 'next/navigation';
import { SidebarProvider } from 'src/components/animate-ui/radix/sidebar';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: Locale }>;
}

const PremiumModal = dynamic(() =>
  import('@ui/modules/components/premium/PremiumModal').then((module) => ({ default: module.PremiumModal }))
);

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
    <html lang={locale}>
      <body className={cn(geistSans.variable, geistMono.variable, 'font-sans antialiased')}>
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
            <SidebarProvider>
              <StoresInitializer />
              <AppSidebar locale={locale}>
                <div
                  className='pointer-events-none h-full z-1 rounded-lg inset-0 absolute
  bg-[linear-gradient(to_right,var(--grid-color)_1px,transparent_1px),linear-gradient(to_bottom,var(--grid-color)_1px,transparent_1px)]
  bg-[length:4rem_4rem]'
                  aria-hidden='true'
                />
                <SiteTitle />
                <SiteSubtitle />
                {children}
                <Toaster />
                <DonateClient />
                <PremiumModal />
                <CookieConsent />
                <Footer />
              </AppSidebar>
            </SidebarProvider>
          </ThemeProvider>
        </NextIntlClientProvider>
        <Analytics />
      </body>
    </html>
  );
};

export default Layout;

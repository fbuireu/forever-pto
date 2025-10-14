import { Toaster } from '@const/components/ui/sonner';
import { cn } from '@const/lib/utils';
import { routing } from '@infrastructure/i18n/routing';
import '@styles/index.css';
import { AppSidebar } from '@ui/modules/components/appSidebar/AppSidebar';
import { Analytics } from '@ui/modules/components/core/Analytics';
import { CookieConsent } from '@ui/modules/components/core/CookieConsent';
import { Donate } from '@ui/modules/components/core/Donate';
import { SiteTitle } from '@ui/modules/components/core/SiteTitle';
import { Footer } from '@ui/modules/components/footer/Footer';
import { StoresInitializer } from '@ui/store/StoresInitializer';
import { type Locale, NextIntlClientProvider, hasLocale } from 'next-intl';
import { ThemeProvider } from 'next-themes';
import dynamic from 'next/dynamic';
import { Geist, Geist_Mono } from 'next/font/google';
import { cookies } from 'next/headers';
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

const Layout = async ({ children, params }: Readonly<LayoutProps>) => {
  const { locale } = await params;
  const cookieStore = await cookies();
  const userCountry = cookieStore.get('user-country')?.value;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  return (
    // <ErrorBoundary>
    <html lang={locale}>
      <body className={cn(geistSans.variable, geistMono.variable, 'antialiased')}>
        <NextIntlClientProvider>
          <ThemeProvider
            attribute='data-theme'
            defaultTheme='system'
            storageKey='theme'
            enableSystem
            disableTransitionOnChange
          >
            <SidebarProvider>
              <StoresInitializer userCountry={userCountry} />
              <AppSidebar locale={locale}>
                <SiteTitle />
                {children}
                <Toaster />
                <Donate />
                <PremiumModal />
                <CookieConsent />
              </AppSidebar>
            </SidebarProvider>
            <Footer />
          </ThemeProvider>
        </NextIntlClientProvider>
        <Analytics />
      </body>
    </html>
    // </ErrorBoundary>
  );
};

export default Layout;

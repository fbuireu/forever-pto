import { cn } from '@const/lib/utils';
import { routing } from '@infrastructure/i18n/routing';
import { type Locale, NextIntlClientProvider, hasLocale } from 'next-intl';
import { ThemeProvider } from 'next-themes';
import dynamic from 'next/dynamic';
import { Geist, Geist_Mono } from 'next/font/google';
import { notFound } from 'next/navigation';
import { SidebarProvider } from 'src/components/animate-ui/radix/sidebar';
import { Toaster } from '@const/components/ui/sonner';
import '../globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

interface LayoutProps {
  locale: Locale;
  children: React.ReactNode;
  params: Promise<{ locale: Locale }>;
}

const PremiumModal = dynamic(() =>
  import('@ui/modules/components/premium/PremiumModal').then((module) => ({ default: module.PremiumModal }))
);

const Layout = async ({ children, params }: Readonly<LayoutProps>) => {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  return (
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
              {children}
              <Toaster />
              <PremiumModal />
            </SidebarProvider>
            <footer className='row-start-3 flex gap-[24px] flex-wrap items-center justify-center' />
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
};

export default Layout;

import { SidebarProvider } from '@ui/components/animate/base/sidebar';
import { Toaster } from '@ui/components/primitives/sonner';
import { AppSidebar } from '@ui/modules/components/appSidebar/AppSidebar';
import { CookieConsentClient } from '@ui/modules/components/core/CookieConsentClient';
import { DonateClient } from '@ui/modules/components/core/DonateClient';
import { SiteSubtitle } from '@ui/modules/components/core/SiteSubtitle';
import { SiteTitle } from '@ui/modules/components/core/SiteTitle';
import { Footer } from '@ui/modules/components/footer/Footer';
import { StoresInitializer } from '@ui/store/StoresInitializer';
import dynamic from 'next/dynamic';
import type { Locale } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';

const PremiumModal = dynamic(() =>
  import('@ui/modules/components/premium/PremiumModal').then((module) => ({ default: module.PremiumModal }))
);

interface AppLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: Locale }>;
}

const AppLayout = async ({ children, params }: Readonly<AppLayoutProps>) => {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <SidebarProvider>
      <StoresInitializer />
      <AppSidebar locale={locale}>
        <div
          className='pointer-events-none h-full z-1 rounded-[8px] inset-0 absolute
bg-[linear-gradient(to_right,var(--grid-color)_1px,transparent_1px),linear-gradient(to_bottom,var(--grid-color)_1px,transparent_1px)]
bg-size-[4rem_4rem]'
          aria-hidden='true'
        />
        <SiteTitle />
        <SiteSubtitle />
        {children}
        <Toaster />
        <DonateClient />
        <PremiumModal />
        <CookieConsentClient />
        <Footer />
      </AppSidebar>
    </SidebarProvider>
  );
};

export default AppLayout;

import { SidebarProvider } from '@ui/modules/core/animate/base/Sidebar';
import { Toaster } from '@ui/modules/core/primitives/Sonner';
import { SiteSubtitle } from '@ui/modules/pages/planner/SiteSubtitle';
import { SiteTitle } from '@ui/modules/pages/planner/SiteTitle';
import { CookieConsentClient } from '@ui/modules/shared/cookie-consent/CookieConsentClient';
import { DonateClient } from '@ui/modules/shared/donate/DonateClient';
import { Footer } from '@ui/modules/shared/footer/Footer';
import { AppSidebar } from '@ui/modules/sidebar/AppSidebar';
import { StoresInitializer } from '@ui/modules/stores/StoresInitializer';
import dynamic from 'next/dynamic';
import type { Locale } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';

const PremiumModal = dynamic(() =>
  import('@ui/modules/premium/PremiumModal').then((module) => ({ default: module.PremiumModal }))
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

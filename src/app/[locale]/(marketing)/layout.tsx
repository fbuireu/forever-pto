import { Toaster } from '@ui/modules/core/primitives/Sonner';
import { Header } from '@ui/modules/pages/homepage/navigation/Navigation';
import { Footer } from '@ui/modules/shared/footer/Footer';
import type { Locale } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';

interface MarketingLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: Locale }>;
}

const MarketingLayout = async ({ children, params }: Readonly<MarketingLayoutProps>) => {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className='min-h-screen flex flex-col text-foreground bg-background'>
      <Header />
      {children}
      <Footer />
      <Toaster />
    </div>
  );
};

export default MarketingLayout;

import { Footer } from '@ui/modules/shared/footer/Footer';
import { Navigation } from '@ui/modules/pages/homepage/navigation/Navigation';
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
      <Navigation />
      {children}
      <Footer />
    </div>
  );
};

export default MarketingLayout;

import { Footer } from '@ui/modules/components/footer/Footer';
import type { Locale } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import { MarketingNav } from './_components/MarketingNav';

interface MarketingLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: Locale }>;
}

const MarketingLayout = async ({ children, params }: Readonly<MarketingLayoutProps>) => {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className='min-h-screen bg-[var(--background)] text-[var(--foreground)] flex flex-col'>
      <MarketingNav />
      <main id='main-content' className='flex-1'>
        {children}
      </main>
      <div className='px-7 py-8 bg-[var(--background)] border-t-[4px] border-[var(--frame)]'>
        <div className='max-w-[1240px] mx-auto'>
          <Footer />
        </div>
      </div>
    </div>
  );
};

export default MarketingLayout;

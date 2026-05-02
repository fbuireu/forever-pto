import { Footer } from '@ui/modules/shared/footer/Footer';
import type { Locale } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import { Navigation } from 'src/ui/modules/pages/homepage/navigation/Navigation';

interface LegalLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: Locale }>;
}

const LegalLayout = async ({ children, params }: Readonly<LegalLayoutProps>) => {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className='min-h-screen bg-background text-foreground flex flex-col'>
      <Navigation />
      <main id='main-content' className='flex-1'>
        {children}
      </main>
      <div className='px-7 py-8 bg-background border-t-4 border-(--frame)'>
        <div className='max-w-310 mx-auto'>
          <Footer />
        </div>
      </div>
    </div>
  );
};

export default LegalLayout;

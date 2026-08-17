import { LOCALES } from '@infrastructure/i18n/locales';
import { Comparison } from '@ui/modules/pages/homepage/sections/Comparison';
import { Faq } from '@ui/modules/pages/homepage/sections/Faq';
import { Features } from '@ui/modules/pages/homepage/sections/Features';
import { Hero } from '@ui/modules/pages/homepage/sections/Hero';
import { HomepageCta } from '@ui/modules/pages/homepage/sections/HomepageCta';
import { HowItWorks } from '@ui/modules/pages/homepage/sections/HowItWorks';
import { Marquee } from '@ui/modules/pages/homepage/sections/Marquee';
import { Pricing } from '@ui/modules/pages/homepage/sections/Pricing';
import { Stats } from '@ui/modules/pages/homepage/sections/Stats';
import { Testimonials } from '@ui/modules/pages/homepage/sections/Testimonials';
import { DonateClient } from '@ui/modules/shared/donate/DonateClient';
import { FaqJsonLd } from '@ui/modules/shared/seo/JsonLd';
import type { Locale } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';

export { generateMetadata } from './metadata';

interface PageProps {
  params: Promise<{ locale: Locale }>;
}

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

const HomePage = async ({ params }: PageProps) => {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <main id='main-content' className='flex-1'>
      <Hero />
      <Marquee />
      <HowItWorks />
      <Stats />
      <Features />
      <Comparison />
      <Testimonials locale={locale} />
      <Pricing />
      <Faq />
      <FaqJsonLd locale={locale} />
      <HomepageCta />
      <DonateClient bottomClassName='bottom-3 md:bottom-4' />
    </main>
  );
};

export default HomePage;

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
      <HomepageCta />
      <DonateClient bottomClassName='bottom-3 md:bottom-4' />
    </main>
  );
};

export default HomePage;

// better stack not working properly
// todo: check everything (algo?, unify radius, colors, effects, everything)
// todo: focus input order in stripe
// todo: new logo stripe
// todo: status pages localized
// todo: all buttons (border color to show shadow?)
// todo: improve responsive
// todo: add context in every folder level?
// todo: share button with results?
// todo: recreate bones
// todo: sponsor the project (reddit, producthunt)
// todo: performance audit, react best practices audit
// todo: ads?
// todo: add LICENCE, SECURITY, etc
// todo: add react compiler (use memo, etc) (at 23rd Dec requires babel plugin)
// todo: unify component and folder structure (payment/provider should be dto?)
// todo: Increase test coverage (check flows, click, pay, etc. Add thresholds)
// todo: track origin of premium key (feature)
// todo: add custom weekends
// todo: slider calendar on mobile
// todo: transformer to make sql data ready ':id': data.id',
// todo: improve error handling in server actions (send whole error type and change icon when "save to db error")
// todo: APPLY DDD + check everything (SSR, CSR, etc)

import { LOCALES } from '@infrastructure/i18n/config';
import { Comparison } from '@ui/modules/pages/homepage/sections/Comparison';
import { Faq } from '@ui/modules/pages/homepage/sections/Faq';
import { Features } from '@ui/modules/pages/homepage/sections/Features';
import { FinalCta } from '@ui/modules/pages/homepage/sections/FinalCta';
import { Hero } from '@ui/modules/pages/homepage/sections/Hero';
import { HowItWorks } from '@ui/modules/pages/homepage/sections/HowItWorks';
import { Marquee } from '@ui/modules/pages/homepage/sections/Marquee';
import { Pricing } from '@ui/modules/pages/homepage/sections/Pricing';
import { Stats } from '@ui/modules/pages/homepage/sections/Stats';
import { Testimonials } from '@ui/modules/pages/homepage/sections/Testimonials';
import { DonateClient } from '@ui/modules/shared/donate/DonateClient';
import { Footer } from '@ui/modules/shared/footer/Footer';
import type { Locale } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import { Navigation } from 'src/ui/modules/pages/homepage/navigation/Navigation';

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
    <div className='min-h-screen bg-background text-foreground flex flex-col'>
      <Navigation />
      <main id='main-content' className='flex-1'>
        <Hero />
        <Marquee />
        <HowItWorks />
        <Stats />
        <Features />
        <Comparison />
        <Testimonials />
        <Pricing />
        <Faq />
        <FinalCta />
        <DonateClient />
      </main>
      <div className='px-7 py-8 bg-background border-t-4 border-(--frame)'>
        <div className='max-w-310 mx-auto'>
          <Footer />
        </div>
      </div>
    </div>
  );
};

export default HomePage;

// todo: brutalist design (show legend in button, remove old brand, redo logo)
// todo: tabs
// todo: Check DSM (dark mode, tipografies, colors, etc)
// todo: 400 and 500 page
// todo: check all buttons
// todo: check all skeletons
// todo: https://isitagentready.com/forever-pto.com
// todo: check lang strings (rename landing for home, no use finalCta or strings like that, etc)
// todo: focus input order in stripe
// todo: check translations
// todo: unify styles and check everything
// todo: html issues (button desc button)
// todo: improve responsive
// todo: https://effect.website/
// todo: https://csswizardry.com/2026/04/what-is-css-containment-and-how-can-i-use-it/
// todo: add boneyard skeleton
// todo: feedback web-check.xyz
// todo: docs with mintlifyy
// todo: share button with results?
// todo: migrate temporal API when available in Node
// todo: sponsor the project (reddit, producthunt)
// todo: unify modal styles (footer actions, spacing, etc)
// todo: performance audit, react best practices audit
// todo: ads?
// todo: add LICENCE, SECURITY, DOCS, WIKI, etc
// todo: add react compiler (use memo, etc) (at 23rd Dec requires babel plugin)
// todo: use grid one-liner for layout calendar https://www.youtube.com/watch?v=Ix_LAId0obw
// todo: unify component and folder structure (payment/provider should be dto?)
// todo: Increase test coverage
// todo: track origin of premium key (feature)
// todo: add custom weekends
// todo: slider calendar on mobile
// todo: fix biome comments (careful with button nesting etc)
// todo: transformer to make sql data ready ':id': data.id',
// todo: improve error handling in server actions (send whole error type and change icon when "save to db error")
// todo: APPLY DDD + check everything (SSR, CSR, etc)

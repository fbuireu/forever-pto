import { LOCALES } from '@infrastructure/i18n/config';
import type { Locale } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import { LandingComparison } from './_components/LandingComparison';
import { LandingFaq } from './_components/LandingFaq';
import { LandingFeatures } from './_components/LandingFeatures';
import { LandingFinalCta } from './_components/LandingFinalCta';
import { LandingHero } from './_components/LandingHero';
import { LandingHowItWorks } from './_components/LandingHowItWorks';
import { LandingMarquee } from './_components/LandingMarquee';
import { LandingPricing } from './_components/LandingPricing';
import { LandingStats } from './_components/LandingStats';
import { LandingTestimonials } from './_components/LandingTestimonials';

export { generateMetadata } from '../metadata';

interface PageProps {
  params: Promise<{ locale: Locale }>;
}

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

const LandingPage = async ({ params }: PageProps) => {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <LandingHero />
      <LandingMarquee />
      <LandingHowItWorks />
      <LandingStats />
      <LandingFeatures />
      <LandingComparison />
      <LandingTestimonials />
      <LandingPricing />
      <LandingFaq />
      <LandingFinalCta />
    </>
  );
};

export default LandingPage;

// todo: brutalist design (show legend in button, remove old brand, redo logo)
// todo: Check DSM
// todo: 400 and 500 page
// todo: check SEO again
// todo: focus input order in stripe
// todo: metadata in translate (separate in home, not landing VS planner)
// todo: check translations
// todo: unify styles and check everything
// todo: html issues (button desc button)
// todo: improve responsive
// todo: https://effect.website/
// todo: https://csswizardry.com/2026/04/what-is-css-containment-and-how-can-i-use-it/
// todo: add boneyard skeleton
// todo: add ubiquitous language
// todo: feedback web-check.xyz
// todo: docs with mintlifyy
// todo: share button with results?
// todo: migrate temporal API when available in Node
// todo: sponsor the project (reddit, producthunt)
// todo: unify modal styles (footer actions, spacing, etc)
// todo: performance audit, react best practices audit
// todo: ads?
// todo: add LICENCE, SECURITY, DOCS, WIKI, etc
// todo: custom 404 and error?
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

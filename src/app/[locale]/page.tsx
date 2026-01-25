import { LOCALES } from '@infrastructure/i18n/config';
import { CalendarList } from '@ui/modules/components/home/CalendarList';
import { Faq } from '@ui/modules/components/home/Faq';
import { HolidaysList } from '@ui/modules/components/home/HolidaysList';
import { Legend } from '@ui/modules/components/home/Legend';
import { ManagementBar } from '@ui/modules/components/home/ManagementBar';
import { Roadmap } from '@ui/modules/components/home/Roadmap';
import { Summary } from '@ui/modules/components/home/Summary';
import type { Locale } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';

export { generateMetadata } from './metadata';

interface LayoutProps {
  params: Promise<{ locale: Locale }>;
}

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

const Home = async ({ params }: LayoutProps) => {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <section className='flex w-full max-w-8xl mx-auto items-start flex-col gap-4 mb-8'>
      <HolidaysList />
      <ManagementBar />
      <CalendarList />
      <Legend />
      <Summary />
      <Roadmap />
      <Faq />
    </section>
  );
};

export default Home;

// todo: fix animations files/imports/layers
// todo: Redo FAQs
// todo: check all texts +  locale all
// todo: template issues + link them through contact modal + roadmap
// todo: check white mode (no hovers?)
// todo: unify modal styles (footer actions, spacing, etc)
// todo: https://github.com/vercel-labs/agent-skills/tree/main/skills/react-best-practices
// todo: ads?
// todo: replace useDetectSticky with css @container scroll-state() (at 8th Jan 2026 not LighntingCSS has the code merged, not released and not adopted by Next)
// todo: add react compiler (use memo, etc) (at 23rd Dec requires babel plugin)
// todo: migrate to base-ui
// todo: performance web workers
// todo: unify component and folder structure (payment/provider should be dto?)
// todo: CI to work on releases
// todo: track origin of premium key (feature)
// todo: add custom weekends
// todo: slider calendar on mobile
// todo: transformer to make sql data ready ':id': data.id',
// todo: fix tab movement (focus)on contact modal 
// todo: improve error handling in server actions (send whole error type and change icon when "save to db error")

// PROD
// todo: cookie management (on PROD)
// todo: stripe rest of config (check all payment methods)
// todo: move prod env vars to cloudflare secrets
// todo: add pages to bookmarks (betterstack, resend)
// todo: SEO site validation etc

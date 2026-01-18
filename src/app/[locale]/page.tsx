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

// todo: add more faqs, check functionality, webhook, db etc
// todo: error text color on donate, payment apparently no webhook. Check overall styles in donate flow
// todo: check texts +  locale all
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

// PROD
// todo: cookie management (on PROD)
// todo: stripe api keys (on PROD) + rest of config
// todo: create new betterstack + new vars

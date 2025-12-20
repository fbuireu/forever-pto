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
import { generateMetadata } from './metadata';

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
      <Faq />
      <Roadmap />
    </section>
  );
};

export default Home;
export { generateMetadata };

// todo: fix error cloudflare stripe
// todo: check node_env variables in cloudflare 
// todo: simplify (bianca's feedback)
// todo: add react compiler (use memo, etc)
// todo: WARN Batch upload failed: Please set R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, and CF_ACCOUNT_ID environment variables to enable faster batch upload for remote R2.

// todo: responsive
// todo: day selector (allow to change days on click)
// todo: add tutorial (driverjs)
// todo: migrate to base-ui
// todo: ads?
// todo: toast vs error messages
// todo: unify component and folder structure (payment/provider should be dto?)
// todo: locale all
// todo: legal pages and cookies (what info do I need to provide?)
// todo: setup stripe
// todo: CI to work on releases

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

// todo: simplify (bianca's feedback)
// todo: overflow issue button on accordion
// todo: add tutorial (driverjs)
// todo: responsive
// todo: add react compiler (use memo, etc) (at 23rd Dec requires babel plugin)
// todo: migrate to base-ui
// todo: ads?
// todo: toast vs error messages
// todo: unify component and folder structure (payment/provider should be dto?)
// todo: locale all
// todo: legal pages and cookies (what info do I need to provide?)
// todo: setup stripe
// todo: CI to work on releases

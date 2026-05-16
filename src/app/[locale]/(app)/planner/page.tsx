import { LOCALES } from '@infrastructure/i18n/config';
import { JsonLd } from '@ui/modules/shared/seo/JsonLd';
import dynamic from 'next/dynamic';
import type { Locale } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';

const HolidaysList = dynamic(() => import('@ui/modules/pages/planner/HolidaysList').then((module) => module.HolidaysList));
const ManagementBar = dynamic(() => import('@ui/modules/pages/planner/ManagementBar').then((module) => module.ManagementBar));
const CalendarList = dynamic(() => import('@ui/modules/pages/planner/CalendarList').then((module) => module.CalendarList));
const Legend = dynamic(() => import('@ui/modules/pages/planner/Legend').then((module) => module.Legend));
const Summary = dynamic(() => import('@ui/modules/pages/planner/Summary').then((module) => module.Summary));
const Roadmap = dynamic(() => import('@ui/modules/pages/planner/Roadmap').then((module) => module.Roadmap));
const Contact = dynamic(() => import('@ui/modules/pages/planner/Contact').then((module) => module.Contact));

export { generateMetadata } from './metadata';

interface PageProps {
  params: Promise<{ locale: Locale }>;
}

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

const AppPage = async ({ params }: PageProps) => {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <JsonLd locale={locale} />
      <section className='flex w-full max-w-8xl mx-auto items-start flex-col gap-4 mb-8'>
        <HolidaysList />
        <ManagementBar />
        <CalendarList />
        <Legend />
        <Summary />
        <Roadmap />
        <Contact />
      </section>
    </>
  );
};

export default AppPage;

import { LOCALES } from '@infrastructure/i18n/config';
import { JsonLd } from '@ui/modules/components/seo/JsonLd';
import dynamic from 'next/dynamic';
import type { Locale } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';

const HolidaysList = dynamic(() => import('@ui/modules/components/home/HolidaysList').then((mod) => mod.HolidaysList));
const ManagementBar = dynamic(() =>
  import('@ui/modules/components/home/ManagementBar').then((mod) => mod.ManagementBar)
);
const CalendarList = dynamic(() => import('@ui/modules/components/home/CalendarList').then((mod) => mod.CalendarList));
const Legend = dynamic(() => import('@ui/modules/components/home/Legend').then((mod) => mod.Legend));
const Summary = dynamic(() => import('@ui/modules/components/home/Summary').then((mod) => mod.Summary));
const Roadmap = dynamic(() => import('@ui/modules/components/home/Roadmap').then((mod) => mod.Roadmap));
const Contact = dynamic(() => import('@ui/modules/components/home/Contact').then((mod) => mod.Contact));

export { generateMetadata } from '../metadata';

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

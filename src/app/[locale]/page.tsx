import { LOCALES } from '@infrastructure/i18n/config';
import { Faq } from '@ui/modules/components/home/Faq';
import { JsonLd } from '@ui/modules/components/seo/JsonLd';
import dynamic from 'next/dynamic';
import type { Locale } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';

const HolidaysList = dynamic(() => import('@ui/modules/components/home/HolidaysList').then((mod) => mod.HolidaysList));
const ManagementBar = dynamic(() => import('@ui/modules/components/home/ManagementBar').then((mod) => mod.ManagementBar));
const CalendarList = dynamic(() => import('@ui/modules/components/home/CalendarList').then((mod) => mod.CalendarList));
const Legend = dynamic(() => import('@ui/modules/components/home/Legend').then((mod) => mod.Legend));
const Summary = dynamic(() => import('@ui/modules/components/home/Summary').then((mod) => mod.Summary));
const Roadmap = dynamic(() => import('@ui/modules/components/home/Roadmap').then((mod) => mod.Roadmap));
const Contact = dynamic(() => import('@ui/modules/components/home/Contact').then((mod) => mod.Contact));

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
        <Faq />
      </section>
    </>
  );
};

export default Home;

// todo: brutalist design
// todo: improve responsive
// todo: https://effect.website/
// todo: https://csswizardry.com/2026/04/what-is-css-containment-and-how-can-i-use-it/
// todo: add boneyard skeleton
// todo: add ubiquitous language
// todo: feedback web-check.xyz
// todo: migrate from tailwind to css modules
// todo: docs with mintlifyy
// todo: share button with results?
// todo: migrate temporal API when available in Node
// todo: unify modal styles (footer actions, spacing, etc)
// todo: performance audit, react best practices audit
// todo: ads?
// todo: add LICENCE, SECURITY, DOCS, WIKI, etc
// todo: custom 404 and error?
// todo: add react compiler (use memo, etc) (at 23rd Dec requires babel plugin)
// todo: use grid one-liner for layout calendar https://www.youtube.com/watch?v=Ix_LAId0obw
// todo: unify component and folder structure (payment/provider should be dto?)
// todo: CI to work on releases
// todo: Increase test coverage
// todo: track origin of premium key (feature)
// todo: add custom weekends
// todo: slider calendar on mobile
// todo: fix biome comments (careful with button nesting etc)
// todo: transformer to make sql data ready ':id': data.id',
// todo: improve error handling in server actions (send whole error type and change icon when "save to db error")
// todo: APPLY DDD + check everything (SSR, CSR, etc)

// PROD
// todo: stripe rest of config (check all payment methods)
// todo: add pages to bookmarks (betterstack, resend)
// todo: cookie management (on PROD)

import { AppSidebar } from '@ui/modules/components/appSidebar/AppSidebar';
import { CalendarList } from '@ui/modules/components/home/CalendarList';
import { HolidaysList } from '@ui/modules/components/home/HolidaysList';
import { ManagementBar } from '@ui/modules/components/home/ManagementBar';
import { StoresInitializer } from '@ui/store/StoresInitializer';
import type { Locale } from 'next-intl';
import { cookies } from 'next/headers';
import { generateMetadata } from './metadata';
import { Faq } from '@ui/modules/components/home/Faq';
import { Legend } from '@ui/modules/components/home/Legend';

export const runtime = 'edge';

interface HomeProps {
  params: Promise<{ locale: Locale }>;
}

const Home = async ({ params }: HomeProps) => {
  const { locale } = await params;
  const cookieStore = await cookies();
  const userCountry = cookieStore.get('user-country')?.value;

  return (
    <AppSidebar locale={locale}>
      <StoresInitializer userCountry={userCountry} />
      <section className='flex w-full max-w-8xl mx-auto items-start flex-col gap-4'>
        <HolidaysList />
        <ManagementBar />
              <CalendarList />
              <Legend />
        <Faq />
      </section>
    </AppSidebar>
  );
};

export default Home;
export { generateMetadata };

// todo: in the FAQ section add a clearall button

import { AppSidebar } from '@ui/modules/components/appSidebar/AppSidebar';
import { CalendarList } from '@ui/modules/components/home/CalendarList';
import { ManagementBar } from '@ui/modules/components/home/ManagementBar';
import { StoresInitializer } from '@ui/store/StoresInitializer';
import type { Locale } from 'next-intl';
import { cookies } from 'next/headers';
import { generateMetadata } from './metadata';

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
      <StoresInitializer userCountry={userCountry} locale={locale} />
      <section className='flex w-fit mx-auto items-start flex-col gap-8'>
        <ManagementBar />
        <CalendarList />
      </section>
    </AppSidebar>
  );
};

export default Home;
export { generateMetadata };

// todo: recheck algo (should split days if needed) + alternative algo weird decisions
// todo: in the FAQ section add a clearall button

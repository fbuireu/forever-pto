import { AppSidebar } from '@ui/modules/components/appSidebar/AppSidebar';
import { CalendarList } from '@ui/modules/components/home/CalendarList';
import { ManagementBar } from '@ui/modules/components/home/ManagementBar';
import { StoresInitializer } from '@ui/store/StoresInitializer';
import type { Locale } from 'next-intl';
import { cookies } from 'next/headers';

export const runtime = 'edge';

interface ForeverPtoProps {
  params: Promise<{ locale: Locale }>;
}

const ForeverPto = async ({ params }: ForeverPtoProps) => {
  const { locale } = await params;
  const cookieStore = await cookies();
  const userCountry = cookieStore.get('user-country')?.value;

  return (
    <AppSidebar locale={locale}>
      <StoresInitializer userCountry={userCountry} locale={locale} />
      <section className='flex w-fit mx-auto items-start flex-col items-center gap-8'>
        {/* <HolidaysTabs /> */}
        <ManagementBar />
        <CalendarList />
      </section>
    </AppSidebar>
  );
};

export default ForeverPto;

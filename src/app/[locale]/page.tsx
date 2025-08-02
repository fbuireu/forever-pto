import { AppSidebar } from '@ui/modules/components/core/appSidebar/AppSidebar';
import { CalendarList } from '@ui/modules/components/home/CalendarList';
import { StoresInitializer } from '@ui/store/StoresInitializer';
import { Locale } from 'next-intl';
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
    <AppSidebar>
      <StoresInitializer userCountry={userCountry} locale={locale} />
      <CalendarList />
    </AppSidebar>
  );
};

export default ForeverPto;

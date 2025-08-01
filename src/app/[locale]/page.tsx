import { AppSidebar } from '@ui/modules/components/core/appSidebar/AppSidebar';
import { Countries } from '@ui/modules/components/core/Countries';
import { Header } from '@ui/modules/components/core/Header';
import { Regions } from '@ui/modules/components/core/Regions';
import { StoreInitializer } from '@ui/modules/components/store/StoreInitializer';
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
      <div className='flex h-16 shrink-0 items-center gap-2 px-4'>
        <h1 className='text-lg font-semibold'>
          Hello world {locale}/{userCountry}
        </h1>
      </div>
      <div className='flex-1 space-y-4 p-4'>
        <StoreInitializer userCountry={userCountry} locale={locale} />
        <Header />
        <Countries />
        <Regions />
      </div>
    </AppSidebar>
  );
};

export default ForeverPto;

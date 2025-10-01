import { AppSidebar } from '@ui/modules/components/appSidebar/AppSidebar';
import { Footer } from '@ui/modules/components/footer/Footer';
import { CalendarList } from '@ui/modules/components/home/CalendarList';
import { Faq } from '@ui/modules/components/home/Faq';
import { HolidaysList } from '@ui/modules/components/home/HolidaysList';
import { Legend } from '@ui/modules/components/home/Legend';
import { ManagementBar } from '@ui/modules/components/home/ManagementBar';
import { Summary } from '@ui/modules/components/home/Summary';
import { StoresInitializer } from '@ui/store/StoresInitializer';
import type { Locale } from 'next-intl';
import { cookies } from 'next/headers';
import { generateMetadata } from './metadata';

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
      <section className='flex w-full max-w-8xl mx-auto items-start flex-col gap-4 mb-8'>
        <HolidaysList />
        <ManagementBar />
        <CalendarList />
        <Legend />
        <Summary />
        <Faq />
      </section>
      <Footer />
    </AppSidebar>
  );
};

export default Home;
export { generateMetadata };

// todo: check validation premium
// todo: unify component and folder structure
// todo: locale all
// todo: legal and cookies 
// todo: roadmap
// todo: legal pages
// todo: add animate icons (https://animate-ui.com/docs/icons)
// todo: add animate components to summary (sliding)
// todo: setup stripe
// todo: setup promo code + apply feedback and checks

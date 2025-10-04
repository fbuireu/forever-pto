import { CalendarList } from '@ui/modules/components/home/CalendarList';
import { Faq } from '@ui/modules/components/home/Faq';
import { HolidaysList } from '@ui/modules/components/home/HolidaysList';
import { Legend } from '@ui/modules/components/home/Legend';
import { ManagementBar } from '@ui/modules/components/home/ManagementBar';
import { Summary } from '@ui/modules/components/home/Summary';
import { generateMetadata } from './metadata';

const Home = async () => (
  <section className='flex w-full max-w-8xl mx-auto items-start flex-col gap-4 mb-8'>
    <HolidaysList />
    <ManagementBar />
    <CalendarList />
    <Legend />
    <Summary />
    <Faq />
  </section>
);

export default Home;
export { generateMetadata };

// todo: check validation premium
// todo: unify component and folder structure
// todo: locale all
// todo: roadmap
// todo: responsive
// todo: legal pages and cookies (what info do I need to provide?)
// todo: add animate icons (https://animate-ui.com/docs/icons)
// todo: add animate components to summary (sliding)
// todo: setup stripe
// todo: save email localStorage to prefill payment form

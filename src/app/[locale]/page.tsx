import { log } from '@logtail/next';
import { CalendarList } from '@ui/modules/components/home/CalendarList';
import { Faq } from '@ui/modules/components/home/Faq';
import { HolidaysList } from '@ui/modules/components/home/HolidaysList';
import { Legend } from '@ui/modules/components/home/Legend';
import { ManagementBar } from '@ui/modules/components/home/ManagementBar';
import { Roadmap } from '@ui/modules/components/home/Roadmap';
import { Summary } from '@ui/modules/components/home/Summary';
import { generateMetadata } from './metadata';

const Home = async () => {
  log.info('Home page rendered');

  return (
      <section className='flex w-full max-w-8xl mx-auto items-start flex-col gap-4 mb-8'>
        <HolidaysList />
        <ManagementBar />
        <CalendarList />
        <Legend />
        <Summary />
        <Faq />
        <Roadmap />
      </section>
  );
};

export default Home;
export { generateMetadata };

// todo: ads?
// todo: toast vs error messages
// todo: setup better stack
// todo: stripe appearance (warnings + fix)
// todo: unify component and folder structure
// todo: locale all
// todo: responsive
// todo: legal pages and cookies (what info do I need to provide?)
// todo: setup stripe

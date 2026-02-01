'use client';

import { Link } from '@infrastructure/i18n/navigation';
import { useTutorial } from '@ui/hooks/useTutorial';

export const SiteSubtitle = () => {
  const { startTutorial } = useTutorial();

  return (
    <p className='text-center text-muted-foreground mt-2 mb-16'>
      Start by adding your days on the left sidebar and the rest of your configurations. Still doubts?{' '}
      <button onClick={startTutorial} className='hover:underline cursor-pointer text-foreground font-medium'>
        Take a quick tour
      </button>{' '}
      or{' '}
      <Link className='hover:underline text-foreground font-medium' href='#faq'>
        check our FAQs
      </Link>
      .
    </p>
  );
};

'use client';

import { Link } from '@application/i18n/navigtion';
import { useAppTutorial } from '@ui/hooks/useAppTutorial';

export const SiteSubtitle = () => {
  const { startTutorial } = useAppTutorial();

  return (
    <p className='text-center text-muted-foreground mt-2 mb-16'>
      Start by adding your days on the left sidebar and the rest of your configurations.{' '}
      <button onClick={startTutorial} className='hover:underline cursor-pointer text-foreground font-medium'>
        Take a quick tour
      </button>{' '}
      or{' '}
      <Link className='hover:underline' href='#faq'>
        check our FAQs
      </Link>
      .
    </p>
  );
};

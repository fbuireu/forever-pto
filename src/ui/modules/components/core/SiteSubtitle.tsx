'use client';

import { Link } from '@application/i18n/navigtion';
import { useTutorial } from '@ui/hooks/useTutorial';
import { useTranslations } from 'next-intl';

export const SiteSubtitle = () => {
  const t = useTranslations('home');
  const { startTutorial } = useTutorial();

  return (
    <p className='text-center text-muted-foreground leading-tight mt-2 mb-16'>
      {t('instructions')}{' '}
      <button onClick={startTutorial} className='hover:underline cursor-pointer text-foreground font-medium'>
        {t('quickTour')}
      </button>{' '}
      {t('or')}{' '}
      <Link className='hover:underline text-foreground font-medium' href='#faq'>
        {t('checkFaqs')}
      </Link>
      .
    </p>
  );
};

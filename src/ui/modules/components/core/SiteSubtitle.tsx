'use client';

import { Link } from '@application/i18n/navigtion';
import { useTutorial } from '@ui/hooks/useTutorial';
import { useTranslations } from 'next-intl';

export const SiteSubtitle = () => {
  const t = useTranslations('home');
  const { startTutorial } = useTutorial();

  return (
    <p className='mx-auto mt-2 mb-16 max-w-4xl rounded-[1.3rem] border-[2.5px] border-[var(--frame)] bg-card px-5 py-4 text-center leading-relaxed text-muted-foreground shadow-[var(--shadow-brutal-md)]'>
      {t('instructions')}{' '}
      <button
        type='button'
        onClick={startTutorial}
        className='cursor-pointer font-black text-foreground underline decoration-[2px] underline-offset-4 transition-colors hover:text-[var(--color-brand-purple-deep)]'
      >
        {t('quickTour')}
      </button>{' '}
      {t('or')}{' '}
      <Link
        className='font-black text-foreground underline decoration-[2px] underline-offset-4 transition-colors hover:text-[var(--color-brand-orange-deep)]'
        href='/#faq'
        onClick={(event) => {
          const faq = document.getElementById('faq');

          if (!faq) {
            return;
          }
          event.preventDefault();
          faq.scrollIntoView({ behavior: 'smooth' });
        }}
      >
        {t('checkFaqs')}
      </Link>
      .
    </p>
  );
};

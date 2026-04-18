'use client';

import { Button } from '@ui/components/animate/components/buttons/button';
import { useTutorial } from '@ui/hooks/useTutorial';
import { useTranslations } from 'next-intl';

export const Tutorial = () => {
  const t = useTranslations('tutorial');
  const { startTutorial } = useTutorial();

  return (
    <div className='space-y-2'>
      <p className='text-sm text-muted-foreground'>{t('description')}</p>
      <Button onClick={startTutorial}>{t('startButton')}</Button>
    </div>
  );
};

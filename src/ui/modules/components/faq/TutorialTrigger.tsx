'use client';

import { useTutorial } from '@ui/hooks/useTutorial';
import { useTranslations } from 'next-intl';
import { Button } from 'src/components/animate-ui/components/buttons/button';

export const TutorialTrigger = () => {
  const t = useTranslations('tutorial');
  const { startTutorial } = useTutorial();

  return (
    <div className='space-y-2'>
      <p className='text-sm text-muted-foreground'>{t('description')}</p>
      <Button onClick={startTutorial} variant='outline' size='sm'>
        {t('restartButton')}
      </Button>
    </div>
  );
};

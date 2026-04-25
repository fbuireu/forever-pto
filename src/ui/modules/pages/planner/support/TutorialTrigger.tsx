'use client';

import { Button } from '@ui/modules/core/animate/components/buttons/Button';
import { useTutorial } from '@ui/hooks/useTutorial';
import { useTranslations } from 'next-intl';

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

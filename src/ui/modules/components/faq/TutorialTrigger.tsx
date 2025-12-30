'use client';

import { useTutorial } from '@ui/hooks/useTutorial';
import { Button } from 'src/components/animate-ui/components/buttons/button';

export const TutorialTrigger = () => {
  const { startTutorial } = useTutorial();

  return (
    <div className='space-y-2'>
      <p className='text-sm text-muted-foreground'>
        Want to see the interactive tutorial again? Click the button below to restart the guided tour through all the
        features and settings.
      </p>
      <Button onClick={startTutorial} variant='outline' size='sm'>
        Restart Interactive Tutorial
      </Button>
    </div>
  );
};

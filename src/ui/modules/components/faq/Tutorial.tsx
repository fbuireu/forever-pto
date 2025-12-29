'use client';

import { useAppTutorial } from '@ui/hooks/useAppTutorial';
import { Button } from 'src/components/animate-ui/components/buttons/button';

export const Tutorial = () => {
  const { startTutorial } = useAppTutorial();

  return (
    <div className='space-y-2'>
      <p className='text-sm text-muted-foreground'>
        Start by entering your PTO details in the left sidebar: your PTO available, your country and your region. We
        will handle the rest for you. If you still have doubts you can click the following button to start an
        interactive tutorial.
      </p>
      <Button onClick={startTutorial}>Start tutorial</Button>
    </div>
  );
};

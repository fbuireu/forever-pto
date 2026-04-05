'use client';

import { useTutorial } from '@ui/hooks/useTutorial';
import { useTranslations } from 'next-intl';
import dynamic from 'next/dynamic';
import { useState } from 'react';
import { Button } from 'src/components/animate-ui/components/buttons/button';

const DriverStyles = dynamic(() =>
  import('@ui/modules/components/core/DriverStyles').then((m) => ({ default: m.DriverStyles })),
  { ssr: false }
);

export const Tutorial = () => {
  const t = useTranslations('tutorial');
  const { startTutorial } = useTutorial();
  const [stylesLoaded, setStylesLoaded] = useState(false);

  const handleStart = () => {
    setStylesLoaded(true);
    startTutorial();
  };

  return (
    <div className='space-y-2'>
      {stylesLoaded && <DriverStyles />}
      <p className='text-sm text-muted-foreground'>{t('description')}</p>
      <Button onClick={handleStart}>{t('startButton')}</Button>
    </div>
  );
};

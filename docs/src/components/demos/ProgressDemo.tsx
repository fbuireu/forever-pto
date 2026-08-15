import { LazyMotionProvider } from '@ui/modules/core/animate/providers/LazyMotionProvider';
import { Button } from '@ui/modules/core/primitives/Button';
import { Progress, ProgressOverlayLabel, ProgressTrack } from '@ui/modules/core/primitives/Progress';
import { useState } from 'react';
import { Demo } from '../Demo';

export const ProgressDemo = () => {
  const [value, setValue] = useState(40);

  return (
    <Demo className='flex-col items-stretch'>
      <LazyMotionProvider>
        <Progress value={value}>
          <div className='relative h-5'>
            <ProgressTrack />
            <ProgressOverlayLabel>{value}% of PTO used</ProgressOverlayLabel>
          </div>
        </Progress>
        <div className='flex gap-2'>
          <Button size='sm' variant='outline' onClick={() => setValue((v) => Math.max(0, v - 10))}>
            Use less
          </Button>
          <Button size='sm' variant='outline' onClick={() => setValue((v) => Math.min(100, v + 10))}>
            Use more
          </Button>
        </div>
      </LazyMotionProvider>
    </Demo>
  );
};

export const ProgressCustomDemo = () => (
  <Demo className='flex-col items-stretch'>
    <LazyMotionProvider>
      <Progress value={65}>
        <div className='relative h-[22px]'>
          <ProgressTrack
            className='h-[22px] rounded-full bg-background'
            indicatorClassName='rounded-full border-r-[3px] border-[var(--frame)] bg-[var(--color-brand-teal)]'
            transition={{ type: 'tween', duration: 0.15, ease: 'easeOut' }}
          />
          <ProgressOverlayLabel overlayClassName='text-[var(--color-brand-ink)]'>65% remaining</ProgressOverlayLabel>
        </div>
      </Progress>
    </LazyMotionProvider>
  </Demo>
);

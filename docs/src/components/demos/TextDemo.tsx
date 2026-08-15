import { LazyMotionProvider } from '@ui/modules/core/animate/providers/LazyMotionProvider';
import { RotatingText } from '@ui/modules/core/animate/text/Rotating';
import { SlidingNumber } from '@ui/modules/core/animate/text/SlidingNumber';
import { Button } from '@ui/modules/core/primitives/Button';
import { useState } from 'react';
import { Demo } from '../Demo';

export const SlidingNumberDemo = () => {
  const [value, setValue] = useState(23);

  return (
    <LazyMotionProvider>
      <Demo>
        <Button
          size='icon-sm'
          variant='outline'
          aria-label='Subtract 7'
          onClick={() => setValue((v) => Math.max(0, v - 7))}
        >
          −
        </Button>
        <SlidingNumber number={value} className='font-display text-4xl font-black' />
        <Button size='icon-sm' variant='outline' aria-label='Add 7' onClick={() => setValue((v) => v + 7)}>
          +
        </Button>
        <span className='ml-6 flex items-baseline gap-2 text-muted-foreground'>
          <SlidingNumber number={value / 10} decimalPlaces={1} padStart className='text-2xl font-bold' />
          <code className='text-xs'>decimalPlaces=1 padStart</code>
        </span>
      </Demo>
    </LazyMotionProvider>
  );
};

const ROTATING_WORDS = ['vacations', 'holidays', 'long weekends', 'bridge days'];

export const RotatingTextDemo = () => (
  <LazyMotionProvider>
    <Demo>
      <p className='flex items-center gap-2 text-xl font-semibold'>
        Maximize your
        <RotatingText
          text={ROTATING_WORDS}
          duration={2000}
          className='font-display font-black text-[var(--color-brand-teal)]'
        />
      </p>
    </Demo>
  </LazyMotionProvider>
);

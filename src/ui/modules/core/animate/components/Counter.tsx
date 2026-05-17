'use client';

import { cn } from '@ui/utils/cn';
import { type HTMLMotionProps, m, type Transition } from 'motion/react';
import type { SlidingNumberProps } from '../text/SlidingNumber';
import { SlidingNumber } from '../text/SlidingNumber';

type CounterButtonProps = Omit<React.ComponentProps<'button'>, 'onClick' | 'children'>;

type CounterProps = Omit<HTMLMotionProps<'div'>, 'children'> & {
  number: number;
  setNumber: (number: number) => void;
  label?: string;
  slidingNumberProps?: Omit<SlidingNumberProps, 'number'>;
  buttonProps?: CounterButtonProps;
  decrementButtonProps?: CounterButtonProps;
  incrementButtonProps?: CounterButtonProps;
  transition?: Transition;
};

function Counter({
  number,
  setNumber,
  label,
  className,
  slidingNumberProps,
  buttonProps,
  decrementButtonProps,
  incrementButtonProps,
  transition = { type: 'spring', bounce: 0, stiffness: 300, damping: 30 },
  ...props
}: CounterProps) {
  const btnBase =
    'w-11 flex items-center justify-center bg-[var(--surface-panel-soft)] font-display font-black text-[22px] leading-none hover:bg-[var(--accent)] hover:text-[var(--color-brand-ink)] transition-colors duration-75 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 select-none';

  return (
    <m.div
      data-slot='counter'
      layout
      transition={transition}
      className={cn(
        'inline-flex items-stretch overflow-hidden rounded-xl border-[3px] border-(--frame) bg-(--surface-panel) shadow-(--shadow-brutal-sm)',
        className
      )}
      {...props}
    >
      <m.button
        type='button'
        whileTap={{ filter: 'brightness(0.85)' }}
        {...(buttonProps as object)}
        {...(decrementButtonProps as object)}
        onClick={() => setNumber(number - 1)}
        className={cn(btnBase, 'border-r-[3px] border-(--frame)', decrementButtonProps?.className)}
      >
        −
      </m.button>

      <div className='w-20 grid place-items-center py-2 leading-none'>
        <SlidingNumber
          number={number}
          {...slidingNumberProps}
          className={cn('font-display font-black text-[22px] leading-none', slidingNumberProps?.className)}
        />
        {label && (
          <small className='font-mono text-[10px] font-semibold text-muted-foreground -mt-px tracking-[0.06em]'>
            {label}
          </small>
        )}
      </div>

      <m.button
        type='button'
        whileTap={{ filter: 'brightness(0.85)' }}
        {...(buttonProps as object)}
        {...(incrementButtonProps as object)}
        onClick={() => setNumber(number + 1)}
        className={cn(btnBase, 'border-l-[3px] border-(--frame)', incrementButtonProps?.className)}
      >
        +
      </m.button>
    </m.div>
  );
}

export { Counter };

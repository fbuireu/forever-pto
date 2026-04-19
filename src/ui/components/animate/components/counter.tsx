'use client';

import { cn } from '@ui/lib/utils';
import { type HTMLMotionProps, m, type Transition } from 'motion/react';
import type { SlidingNumberProps } from '../text/sliding-number';
import { SlidingNumber } from '../text/sliding-number';

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
    'w-11 flex items-center justify-center bg-[var(--surface-panel-soft)] font-display font-black text-[22px] leading-none hover:bg-[var(--accent)] transition-colors duration-75 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 select-none';

  return (
    <m.div
      data-slot='counter'
      layout
      transition={transition}
      className={cn(
        'inline-flex items-stretch overflow-hidden rounded-[10px] border-[3px] border-[var(--frame)] bg-[var(--surface-panel)] shadow-[4px_4px_0_0_var(--frame)]',
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
        className={cn(btnBase, 'border-r-[3px] border-[var(--frame)]', decrementButtonProps?.className)}
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
          <small className='font-mono text-[10px] font-semibold text-muted-foreground mt-[-1px] tracking-[0.06em]'>
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
        className={cn(btnBase, 'border-l-[3px] border-[var(--frame)]', incrementButtonProps?.className)}
      >
        +
      </m.button>
    </m.div>
  );
}

export { Counter, type CounterProps };

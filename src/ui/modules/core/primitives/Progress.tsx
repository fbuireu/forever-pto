'use client';

import { Progress as ProgressPrimitive } from '@base-ui/react/progress';
import { getStrictContext } from '@ui/utils/context';
import { cn } from '@ui/utils/cn';
import { type HTMLMotionProps, m } from 'motion/react';
import type { ComponentProps } from 'react';

type ProgressContextType = { value: number };
const [ProgressProvider, useProgressContext] = getStrictContext<ProgressContextType>('ProgressContext');

type ProgressProps = ComponentProps<typeof ProgressPrimitive.Root>;

function Progress({ value, children, ...props }: ProgressProps) {
  return (
    <ProgressProvider value={{ value: value ?? 0 }}>
      <ProgressPrimitive.Root data-slot='progress' value={value} {...props}>
        {children}
      </ProgressPrimitive.Root>
    </ProgressProvider>
  );
}

const MotionIndicator = m.create(ProgressPrimitive.Indicator);

type ProgressTrackProps = ComponentProps<typeof ProgressPrimitive.Track> & {
  indicatorClassName?: string;
  transition?: HTMLMotionProps<'div'>['transition'];
};

function ProgressTrack({
  className,
  indicatorClassName,
  transition = { type: 'spring', stiffness: 100, damping: 30 },
  ...props
}: ProgressTrackProps) {
  const { value } = useProgressContext();

  return (
    <ProgressPrimitive.Track
      data-slot='progress-track'
      className={cn(
        'relative h-5 w-full overflow-hidden rounded-[6px] border-[3px] border-[var(--frame)] bg-[var(--input)] shadow-[var(--shadow-brutal-xs)]',
        className
      )}
      {...props}
    >
      <MotionIndicator
        data-slot='progress-indicator'
        className={cn('h-full rounded-[3px] bg-[var(--accent)]', indicatorClassName)}
        initial={{ width: '0%' }}
        animate={{ width: `${value}%` }}
        transition={transition}
      />
    </ProgressPrimitive.Track>
  );
}

type ProgressOverlayLabelProps = {
  children: React.ReactNode;
  className?: string;
  overlayClassName?: string;
  transition?: HTMLMotionProps<'div'>['transition'];
};

function ProgressOverlayLabel({
  children,
  className,
  overlayClassName,
  transition = { type: 'tween', duration: 0.15, ease: 'easeOut' },
}: ProgressOverlayLabelProps) {
  const { value } = useProgressContext();
  const clipped = Math.max(0, 100 - Math.min(value, 100));

  return (
    <>
      <span
        className={cn(
          'pointer-events-none absolute inset-0 grid place-items-center font-mono text-[11px] font-bold uppercase text-foreground',
          className
        )}
      >
        {children}
      </span>
      <m.span
        className={cn(
          'pointer-events-none absolute inset-0 grid place-items-center font-mono text-[11px] font-bold uppercase text-primary-foreground',
          overlayClassName
        )}
        initial={{ clipPath: 'inset(0 100% 0 0)' }}
        animate={{ clipPath: `inset(0 ${clipped}% 0 0)` }}
        transition={transition}
        aria-hidden
      >
        {children}
      </m.span>
    </>
  );
}

export { Progress, ProgressOverlayLabel, ProgressTrack };

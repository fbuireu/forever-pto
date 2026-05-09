'use client';

import { Progress as ProgressPrimitive } from '@base-ui/react/progress';
import { SlidingNumber } from '@ui/modules/core/animate/text/SlidingNumber';
import { getStrictContext } from '@ui/utils/context';
import { cn } from '@ui/utils/utils';
import { type HTMLMotionProps, m, motion } from 'motion/react';
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

const MotionIndicator = motion.create(ProgressPrimitive.Indicator);

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

type ProgressLabelProps = ComponentProps<typeof ProgressPrimitive.Label>;

function ProgressLabel({ className, ...props }: ProgressLabelProps) {
  return (
    <ProgressPrimitive.Label
      data-slot='progress-label'
      className={cn('text-sm font-mono font-black uppercase tracking-[0.06em] text-foreground', className)}
      {...props}
    />
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

type ProgressValueProps = Omit<ComponentProps<typeof ProgressPrimitive.Value>, 'render'> & {
  className?: string;
  suffix?: string;
};

function ProgressValue({ className, suffix = '%', ...props }: ProgressValueProps) {
  const { value } = useProgressContext();

  return (
    <ProgressPrimitive.Value
      data-slot='progress-value'
      render={
        <m.span
          className={cn(
            'inline-flex items-baseline gap-0.5 text-sm font-mono font-black tabular-nums text-foreground',
            className
          )}
        >
          <SlidingNumber number={Math.round(value)} />
          <span className='text-xs text-muted-foreground'>{suffix}</span>
        </m.span>
      }
      {...props}
    />
  );
}

export {
  Progress,
  ProgressLabel,
  type ProgressLabelProps,
  ProgressOverlayLabel,
  type ProgressOverlayLabelProps,
  type ProgressProps,
  ProgressTrack,
  type ProgressTrackProps,
  ProgressValue,
  type ProgressValueProps,
  useProgressContext,
};

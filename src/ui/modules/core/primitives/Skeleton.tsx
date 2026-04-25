import { cn } from '@ui/utils/utils';

function Skeleton({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot='skeleton'
      className={cn(
        'rounded-[8px] border-[3px] border-[var(--frame)] bg-[linear-gradient(90deg,var(--muted)_25%,color-mix(in_srgb,var(--muted)_60%,white_40%)_50%,var(--muted)_75%)] bg-[length:200%_100%] animate-[shimmer_1.4s_infinite_linear]',
        className
      )}
      {...props}
    />
  );
}

export { Skeleton };

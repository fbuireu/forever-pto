import { Slot } from '@ui/lib/slot';
import { cn } from '@ui/utils/utils';
import { cva, type VariantProps } from 'class-variance-authority';
import type * as React from 'react';

const badgeVariants = cva(
  'inline-flex items-center justify-center rounded-full border-[3px] border-[var(--frame)] px-3 py-1 text-[0.7rem] font-black uppercase tracking-[0.08em] w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background aria-invalid:border-destructive transition-all duration-75 ease-linear overflow-hidden shadow-[var(--shadow-brutal-xs)]',
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground [a&]:hover:-translate-x-0.5 [a&]:hover:-translate-y-0.5 [a&]:hover:shadow-[var(--shadow-brutal-sm)]',
        secondary:
          'bg-secondary text-secondary-foreground [a&]:hover:-translate-x-0.5 [a&]:hover:-translate-y-0.5 [a&]:hover:shadow-[var(--shadow-brutal-sm)]',
        destructive:
          'bg-destructive text-white [a&]:hover:-translate-x-0.5 [a&]:hover:-translate-y-0.5 [a&]:hover:shadow-[var(--shadow-brutal-sm)]',
        outline:
          'bg-[var(--surface-panel)] text-foreground [a&]:hover:-translate-x-0.5 [a&]:hover:-translate-y-0.5 [a&]:hover:bg-[var(--surface-panel-alt)]',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<'span'> & VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : 'span';

  return <Comp data-slot='badge' className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };

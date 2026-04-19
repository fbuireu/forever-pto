import { Slot } from '@ui/lib/slot';
import { cn } from '@ui/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';
import type * as React from 'react';

const badgeVariants = cva(
  'inline-flex items-center justify-center rounded-[0.8rem] border-[2px] border-[var(--frame)] px-2.5 py-1 text-[0.72rem] font-black uppercase tracking-[0.08em] w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background aria-invalid:border-destructive transition-[color,box-shadow,transform,background-color] overflow-hidden shadow-[var(--shadow-brutal-xs)]',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground [a&]:hover:-translate-y-0.5 [a&]:hover:bg-primary/90',
        secondary: 'bg-secondary text-secondary-foreground [a&]:hover:-translate-y-0.5 [a&]:hover:bg-secondary/90',
        destructive:
          'bg-destructive text-[var(--color-brand-paper)] [a&]:hover:-translate-y-0.5 [a&]:hover:bg-destructive/90',
        outline:
          'bg-[var(--surface-panel)] text-foreground [a&]:hover:-translate-y-0.5 [a&]:hover:bg-[var(--surface-panel-alt)] [a&]:hover:text-foreground',
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

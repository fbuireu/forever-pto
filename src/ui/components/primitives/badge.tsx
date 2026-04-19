import { Slot } from '@ui/lib/slot';
import { cn } from '@ui/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';
import type * as React from 'react';

const badgeVariants = cva(
  'inline-flex items-center justify-center rounded-none border-2 px-2 py-0.5 text-xs font-bold w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:ring-2 focus-visible:ring-black dark:focus-visible:ring-white focus-visible:ring-offset-1 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground border-black dark:border-white [a&]:hover:bg-primary/90',
        secondary: 'bg-secondary text-secondary-foreground border-black dark:border-white [a&]:hover:bg-secondary/90',
        destructive:
          'bg-destructive text-white border-black dark:border-white [a&]:hover:bg-destructive/90 dark:bg-destructive/60',
        outline: 'text-foreground border-black dark:border-white [a&]:hover:bg-accent [a&]:hover:text-accent-foreground',
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

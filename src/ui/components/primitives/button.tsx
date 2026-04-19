import { Slot } from '@ui/lib/slot';
import { cn } from '@ui/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';
import type { ComponentProps } from 'react';

const buttonVariants = cva(
  "cursor-pointer inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-none text-sm font-bold transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-black dark:focus-visible:ring-white aria-invalid:border-destructive border-2",
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground border-black dark:border-white shadow-[4px_4px_0_0_black] dark:shadow-[4px_4px_0_0_white] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_black] dark:hover:shadow-[2px_2px_0_0_white] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none',
        destructive:
          'bg-destructive text-white border-black dark:border-white shadow-[4px_4px_0_0_black] dark:shadow-[4px_4px_0_0_white] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_black] dark:hover:shadow-[2px_2px_0_0_white] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none',
        outline:
          'bg-background border-black dark:border-white shadow-[4px_4px_0_0_black] dark:shadow-[4px_4px_0_0_white] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_black] dark:hover:shadow-[2px_2px_0_0_white] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none hover:bg-accent hover:text-accent-foreground',
        secondary:
          'bg-secondary text-secondary-foreground border-black dark:border-white shadow-[4px_4px_0_0_black] dark:shadow-[4px_4px_0_0_white] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_black] dark:hover:shadow-[2px_2px_0_0_white] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none',
        ghost: 'border-transparent hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50',
        link: 'border-transparent text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-9 px-4 py-2 has-[>svg]:px-3',
        sm: 'h-8 gap-1.5 px-3 has-[>svg]:px-2.5',
        lg: 'h-10 px-6 has-[>svg]:px-4',
        icon: 'size-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : 'button';

  return <Comp data-slot='button' className={cn(buttonVariants({ variant, size, className }))} {...props} />;
}

export { Button, buttonVariants };

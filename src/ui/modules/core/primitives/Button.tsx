import { Slot } from '@ui/lib/slot';
import { cn } from '@ui/utils/utils';
import { cva, type VariantProps } from 'class-variance-authority';
import type { ComponentProps } from 'react';

const buttonVariants = cva(
  "cursor-pointer inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[8px] text-sm font-black tracking-[0.01em] transition-all duration-75 ease-linear disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none disabled:translate-x-0 disabled:translate-y-0 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background aria-invalid:border-destructive border-[3px] border-[var(--frame)]",
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground shadow-[var(--shadow-brutal-btn)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[var(--shadow-brutal-btn-hover)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[var(--shadow-brutal-btn-active)]',
        accent:
          'bg-accent text-accent-foreground shadow-[var(--shadow-brutal-btn)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[var(--shadow-brutal-btn-hover)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[var(--shadow-brutal-btn-active)]',
        destructive:
          'bg-destructive text-white shadow-[var(--shadow-brutal-btn)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[var(--shadow-brutal-btn-hover)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[var(--shadow-brutal-btn-active)]',
        outline:
          'bg-[var(--surface-panel)] text-foreground shadow-[var(--shadow-brutal-btn)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:bg-[var(--surface-panel-alt)] hover:shadow-[var(--shadow-brutal-btn-hover)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[var(--shadow-brutal-btn-active)]',
        secondary:
          'bg-secondary text-secondary-foreground shadow-[var(--shadow-brutal-btn)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:bg-[color-mix(in_srgb,var(--secondary)_85%,white_15%)] hover:shadow-[var(--shadow-brutal-btn-hover)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[var(--shadow-brutal-btn-active)]',
        ghost:
          'border-transparent bg-transparent shadow-none hover:bg-[var(--accent)] hover:border-[var(--frame)] hover:text-foreground active:translate-x-0 active:translate-y-0 active:bg-[var(--accent)]',
        link: 'border-transparent text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-11 px-5 py-2.5 has-[>svg]:px-4',
        sm: 'h-9 gap-1.5 px-3.5 has-[>svg]:px-3',
        lg: 'h-12 px-6 has-[>svg]:px-5',
        icon: 'size-11',
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

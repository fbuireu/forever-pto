import { Slot } from '@ui/lib/slot';
import { cn } from '@ui/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';
import type { ComponentProps } from 'react';

const buttonVariants = cva(
  "cursor-pointer inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[0.95rem] text-sm font-black tracking-[0.01em] transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background aria-invalid:border-destructive border-[2.5px] border-[var(--frame)]",
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground shadow-[var(--shadow-brutal-sm)] hover:-translate-y-0.5 hover:translate-x-0.5 hover:shadow-[var(--shadow-brutal-md)] active:translate-y-1 active:translate-x-1 active:shadow-none',
        destructive:
          'bg-destructive text-[var(--color-brand-paper)] shadow-[var(--shadow-brutal-sm)] hover:-translate-y-0.5 hover:translate-x-0.5 hover:shadow-[var(--shadow-brutal-md)] active:translate-y-1 active:translate-x-1 active:shadow-none',
        outline:
          'bg-[var(--surface-panel)] text-foreground shadow-[var(--shadow-brutal-sm)] hover:-translate-y-0.5 hover:translate-x-0.5 hover:bg-[var(--surface-panel-alt)] hover:shadow-[var(--shadow-brutal-md)] active:translate-y-1 active:translate-x-1 active:shadow-none',
        secondary:
          'bg-secondary text-secondary-foreground shadow-[var(--shadow-brutal-sm)] hover:-translate-y-0.5 hover:translate-x-0.5 hover:bg-[color-mix(in_srgb,var(--secondary)_82%,white_18%)] hover:shadow-[var(--shadow-brutal-md)] active:translate-y-1 active:translate-x-1 active:shadow-none',
        ghost:
          'border-transparent bg-transparent shadow-none hover:-translate-y-0.5 hover:bg-[var(--surface-panel-alt)] hover:text-foreground active:translate-y-0 active:translate-x-0 active:bg-[var(--surface-panel-inset)]',
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

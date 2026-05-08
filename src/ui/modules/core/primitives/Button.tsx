import { cn } from '@ui/utils/utils';
import { cva, type VariantProps } from 'class-variance-authority';
import type { ComponentProps } from 'react';
import { Slot } from '../animate/base/Slot';

const buttonVariants = cva(
  "relative cursor-pointer inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[8px] text-sm font-black tracking-[0.01em] transition-[color,background-color,border-color,box-shadow,transform] duration-75 ease-linear disabled:pointer-events-none disabled:opacity-50 disabled:cursor-default disabled:shadow-none disabled:translate-x-0 disabled:translate-y-0 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background aria-invalid:ring-destructive/20 aria-invalid:border-destructive border-[3px] border-[var(--frame)] before:content-[''] before:absolute before:-inset-[5px]",
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground shadow-[var(--shadow-brutal-btn)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-[var(--shadow-brutal-btn-hover)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[var(--shadow-brutal-btn-active)] data-[popup-open]:-translate-x-0.5 data-[popup-open]:-translate-y-0.5 data-[popup-open]:shadow-[var(--shadow-brutal-btn-hover)]',
        accent:
          'bg-accent text-accent-foreground shadow-[var(--shadow-brutal-btn)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:bg-accent/90 hover:shadow-[var(--shadow-brutal-btn-hover)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[var(--shadow-brutal-btn-active)] data-[popup-open]:-translate-x-0.5 data-[popup-open]:-translate-y-0.5 data-[popup-open]:shadow-[var(--shadow-brutal-btn-hover)]',
        destructive:
          'bg-destructive text-[var(--color-brand-paper)] shadow-[var(--shadow-brutal-btn)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:bg-destructive/90 hover:shadow-[var(--shadow-brutal-btn-hover)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[var(--shadow-brutal-btn-active)] focus-visible:ring-destructive/20 data-[popup-open]:-translate-x-0.5 data-[popup-open]:-translate-y-0.5 data-[popup-open]:shadow-[var(--shadow-brutal-btn-hover)]',
        success:
          'bg-green-600 text-white shadow-[var(--shadow-brutal-btn)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:bg-green-700 hover:shadow-[var(--shadow-brutal-btn-hover)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[var(--shadow-brutal-btn-active)] data-[popup-open]:-translate-x-0.5 data-[popup-open]:-translate-y-0.5 data-[popup-open]:shadow-[var(--shadow-brutal-btn-hover)]',
        outline:
          'bg-[var(--surface-panel)] shadow-[var(--shadow-brutal-btn)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:bg-[var(--surface-panel-alt)] hover:text-foreground hover:shadow-[var(--shadow-brutal-btn-hover)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[var(--shadow-brutal-btn-active)] data-[popup-open]:-translate-x-0.5 data-[popup-open]:-translate-y-0.5 data-[popup-open]:shadow-[var(--shadow-brutal-btn-hover)]',
        secondary:
          'bg-secondary text-secondary-foreground shadow-[var(--shadow-brutal-btn)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:bg-secondary/85 hover:shadow-[var(--shadow-brutal-btn-hover)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[var(--shadow-brutal-btn-active)] data-[popup-open]:-translate-x-0.5 data-[popup-open]:-translate-y-0.5 data-[popup-open]:shadow-[var(--shadow-brutal-btn-hover)]',
        ghost:
          'border-transparent shadow-none hover:bg-[var(--surface-panel-alt)] hover:text-foreground active:bg-[var(--surface-panel-inset)]',
        link: 'border-transparent text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-11 px-5 py-2.5 has-[>svg]:px-4',
        sm: 'h-9 gap-1.5 px-3.5 has-[>svg]:px-3',
        lg: 'h-12 px-6 has-[>svg]:px-5',
        icon: 'size-11',
        'icon-sm': 'size-9',
        'icon-lg': 'size-12',
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

'use client';

import { cn } from '@ui/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';
import { Button as ButtonPrimitive, type ButtonProps as ButtonPrimitiveProps } from '../../primitives/buttons/button';

const buttonVariants = cva(
  "cursor-pointer hover:cursor-pointer disabled:cursor-default inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[8px] text-sm font-black tracking-[0.01em] transition-[transform,box-shadow,color,background-color,border-color,_outline-color,_text-decoration-color,_fill,_stroke] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background aria-invalid:ring-destructive/20 aria-invalid:border-destructive border-[3px] border-[var(--frame)]",
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground shadow-[var(--shadow-brutal-btn)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-[var(--shadow-brutal-btn-hover)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[var(--shadow-brutal-btn-active)]',
        accent:
          'bg-accent text-accent-foreground shadow-[var(--shadow-brutal-btn)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:bg-accent/90 hover:shadow-[var(--shadow-brutal-btn-hover)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[var(--shadow-brutal-btn-active)]',
        destructive:
          'bg-destructive text-[var(--color-brand-paper)] shadow-[var(--shadow-brutal-btn)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:bg-destructive/90 hover:shadow-[var(--shadow-brutal-btn-hover)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[var(--shadow-brutal-btn-active)] focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40',
        outline:
          'bg-[var(--surface-panel)] shadow-[var(--shadow-brutal-btn)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:bg-[var(--surface-panel-alt)] hover:text-foreground hover:shadow-[var(--shadow-brutal-btn-hover)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[var(--shadow-brutal-btn-active)]',
        secondary:
          'bg-secondary text-secondary-foreground shadow-[var(--shadow-brutal-btn)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:bg-secondary/85 hover:shadow-[var(--shadow-brutal-btn-hover)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[var(--shadow-brutal-btn-active)]',
        ghost:
          'border-transparent shadow-none hover:-translate-y-0.5 hover:bg-[var(--surface-panel-alt)] hover:text-foreground active:translate-y-0 active:translate-x-0 active:bg-[var(--surface-panel-inset)]',
        link: 'text-primary underline-offset-4 hover:underline',
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

type ButtonProps = ButtonPrimitiveProps & VariantProps<typeof buttonVariants>;

function Button({ className, variant, size, ...props }: ButtonProps) {
  return <ButtonPrimitive className={cn(buttonVariants({ variant, size, className }))} {...props} />;
}

export { Button, type ButtonProps, buttonVariants };

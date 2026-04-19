import { cn } from '@ui/lib/utils';
import type { ComponentProps } from 'react';

function Input({ className, type, ...props }: ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot='input'
      className={cn(
        'file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground flex h-11 w-full min-w-0 rounded-[0.95rem] border-[2.5px] border-[var(--frame)] bg-input px-4 py-2 text-base shadow-[var(--shadow-brutal-xs)] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
        'focus-visible:-translate-y-0.5 focus-visible:shadow-[var(--shadow-brutal-sm)] focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        'aria-invalid:border-destructive aria-invalid:ring-destructive',
        className
      )}
      {...props}
    />
  );
}

export { Input };

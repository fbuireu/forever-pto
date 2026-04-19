import { cn } from '@ui/lib/utils';
import type { ComponentProps } from 'react';

function Input({ className, type, ...props }: ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot='input'
      className={cn(
        'file:text-foreground placeholder:text-muted-foreground selection:bg-accent selection:text-accent-foreground flex h-11 w-full min-w-0 rounded-[8px] border-[3px] border-[var(--frame)] bg-input px-4 py-2 text-base shadow-[var(--shadow-brutal-xs)] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
        'focus-visible:-translate-x-0.5 focus-visible:-translate-y-0.5 focus-visible:shadow-[var(--shadow-brutal-sm)] focus-visible:outline-none',
        'aria-invalid:border-destructive aria-invalid:ring-destructive aria-invalid:shadow-[2px_2px_0_0_var(--destructive)] aria-invalid:focus-visible:shadow-[4px_4px_0_0_var(--destructive)]',
        className
      )}
      {...props}
    />
  );
}

export { Input };

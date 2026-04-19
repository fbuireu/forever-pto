import { cn } from '@ui/lib/utils';
import type { ComponentProps } from 'react';

function Textarea({ className, ...props }: ComponentProps<'textarea'>) {
  return (
    <textarea
      data-slot='textarea'
      className={cn(
        'placeholder:text-muted-foreground flex field-sizing-content min-h-24 w-full rounded-[8px] border-[3px] border-[var(--frame)] bg-input px-4 py-3 text-base shadow-[var(--shadow-brutal-xs)] outline-none transition-all duration-75 ease-linear focus-visible:-translate-x-0.5 focus-visible:-translate-y-0.5 focus-visible:shadow-[var(--shadow-brutal-sm)] focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
        'aria-invalid:border-destructive aria-invalid:shadow-[2px_2px_0_0_var(--destructive)] aria-invalid:focus-visible:shadow-[4px_4px_0_0_var(--destructive)]',
        className
      )}
      {...props}
    />
  );
}

export { Textarea };

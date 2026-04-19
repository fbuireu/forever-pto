import { cn } from '@ui/lib/utils';
import type { ComponentProps } from 'react';

function Textarea({ className, ...props }: ComponentProps<'textarea'>) {
  return (
    <textarea
      data-slot='textarea'
      className={cn(
        'placeholder:text-muted-foreground aria-invalid:border-destructive flex field-sizing-content min-h-24 w-full rounded-[8px] border-[3px] border-[var(--frame)] bg-input px-4 py-3 text-base shadow-[var(--shadow-brutal-xs)] outline-none transition-all duration-75 ease-linear focus-visible:-translate-x-0.5 focus-visible:-translate-y-0.5 focus-visible:shadow-[var(--shadow-brutal-sm)] focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
        className
      )}
      {...props}
    />
  );
}

export { Textarea };

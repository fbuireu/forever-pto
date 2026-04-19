import { cn } from '@ui/lib/utils';
import type { ComponentProps } from 'react';

function Textarea({ className, ...props }: ComponentProps<'textarea'>) {
  return (
    <textarea
      data-slot='textarea'
      className={cn(
        'placeholder:text-muted-foreground aria-invalid:border-destructive flex field-sizing-content min-h-24 w-full rounded-[1rem] border-[2.5px] border-[var(--frame)] bg-input px-4 py-3 text-base shadow-[var(--shadow-brutal-xs)] outline-none focus-visible:-translate-y-0.5 focus-visible:shadow-[var(--shadow-brutal-sm)] focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
        className
      )}
      {...props}
    />
  );
}

export { Textarea };

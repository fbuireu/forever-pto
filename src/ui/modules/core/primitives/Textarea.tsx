import { cn } from '@ui/utils/utils';
import type { ComponentProps } from 'react';

function Textarea({ className, ...props }: ComponentProps<'textarea'>) {
  return (
    <textarea
      data-slot='textarea'
      className={cn(
        'placeholder:text-muted-foreground flex field-sizing-content min-h-24 w-full rounded-[8px] border-[3px] border-[var(--frame)] bg-input px-4 py-3 text-base outline-none transition-[box-shadow,transform] duration-75 ease-linear disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
        'hover:shadow-[var(--shadow-brutal-xs)]',
        'focus-visible:shadow-[var(--shadow-brutal-sm)] focus-visible:outline-none',
        'aria-invalid:border-destructive aria-invalid:shadow-none aria-invalid:focus-visible:shadow-[4px_4px_0_0_var(--destructive)]',
        className
      )}
      {...props}
    />
  );
}

export { Textarea };

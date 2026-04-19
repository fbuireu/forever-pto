import { cn } from '@ui/lib/utils';
import type { ComponentProps } from 'react';

function Textarea({ className, ...props }: ComponentProps<'textarea'>) {
  return (
    <textarea
      data-slot='textarea'
      className={cn(
        'placeholder:text-muted-foreground aria-invalid:border-destructive dark:bg-input/30 flex field-sizing-content min-h-16 w-full rounded-none border-2 border-black dark:border-white bg-transparent px-3 py-2 text-base transition-[color,box-shadow] outline-none focus-visible:ring-2 focus-visible:ring-black dark:focus-visible:ring-white focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
        className
      )}
      {...props}
    />
  );
}

export { Textarea };

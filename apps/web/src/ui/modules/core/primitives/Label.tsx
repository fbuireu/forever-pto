import { cn } from '@ui/utils/cn';
import type { ComponentProps } from 'react';

function Label({ className, ...props }: ComponentProps<'label'>) {
  return (
    <>
      {/* biome-ignore lint/a11y/noLabelWithoutControl: generic component — htmlFor is passed by callers via ...props */}
      <label
        className={cn(
          'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
          className
        )}
        {...props}
      />
    </>
  );
}

export { Label };

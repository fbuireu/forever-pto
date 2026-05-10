import { cn } from '@ui/utils/utils';
import type * as React from 'react';

function Label({ className, ...props }: React.ComponentProps<'label'>) {
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

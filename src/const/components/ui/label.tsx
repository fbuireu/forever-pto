import * as React from 'react';
import { cn } from '@const/lib/utils';

function Label({ className, ...props }: React.ComponentProps<'label'>) {
  return (
    {/* biome-ignore lint/a11y/noLabelWithoutControl: generic component — htmlFor passed via ...props */}
    <label
      className={cn('text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70', className)}
      {...props}
    />
  );
}

export { Label };

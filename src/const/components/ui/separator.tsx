import * as React from 'react';
import { cn } from '@const/lib/utils';

interface SeparatorProps extends React.ComponentProps<'div'> {
  orientation?: 'horizontal' | 'vertical';
  decorative?: boolean;
}

function Separator({ className, orientation = 'horizontal', decorative = true, ...props }: SeparatorProps) {
  return (
    {/* biome-ignore lint/a11y/useAriaPropsSupportedByRole: aria-orientation is valid for role=separator; conditionally omitted when decorative */}
    <div
      role={decorative ? 'none' : 'separator'}
      aria-orientation={decorative ? undefined : orientation}
      className={cn(
        'shrink-0 bg-border',
        orientation === 'horizontal' ? 'h-px w-full' : 'h-full w-px',
        className,
      )}
      {...props}
    />
  );
}

export { Separator };

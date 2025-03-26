import * as TabsPrimitive from '@radix-ui/react-tabs';
import { mergeClasses } from '@ui/utils/mergeClasses';
import type { ComponentProps } from 'react';

export const TabsTrigger = ({ className, ...props }: ComponentProps<typeof TabsPrimitive.Trigger>) => (
    <TabsPrimitive.Trigger
        data-slot="tabs-trigger"
        className={mergeClasses(
            'data-[state=active]:bg-background data-[state=active]:text-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:outline-ring inline-flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1 text-sm font-medium whitespace-nowrap transition-[color,box-shadow] focus-visible:ring-[3px] focus-visible:outline-1 disabled:opacity-50 disabled:cursor-not-allowed data-[state=active]:shadow-sm [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*=\'size-\'])]:size-4',
            className,
        )}
        {...props}
    />
);

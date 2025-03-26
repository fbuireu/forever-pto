'use client';

import * as TabsPrimitive from '@radix-ui/react-tabs';
import { mergeClasses } from '@ui/utils/mergeClasses';
import type { ComponentProps } from 'react';

export const Tabs = ({ className, ...props }: ComponentProps<typeof TabsPrimitive.Root>) => (
    <TabsPrimitive.Root data-slot="tabs" className={mergeClasses('flex flex-col gap-2', className)} {...props} />
);

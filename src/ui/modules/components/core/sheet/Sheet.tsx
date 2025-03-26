'use client';

import * as SheetPrimitive from '@radix-ui/react-dialog';
import type { ComponentProps } from 'react';

export const Sheet = ({ ...props }: ComponentProps<typeof SheetPrimitive.Root>) => (
    <SheetPrimitive.Root data-slot="sheet" {...props} />
);

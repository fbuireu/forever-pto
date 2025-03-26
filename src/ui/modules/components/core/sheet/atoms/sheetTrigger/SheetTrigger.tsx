import * as SheetPrimitive from '@radix-ui/react-dialog';
import type { ComponentProps } from 'react';

export const SheetTrigger = ({ ...props }: ComponentProps<typeof SheetPrimitive.Trigger>) => (
    <SheetPrimitive.Trigger data-slot="sheet-trigger" {...props} />
);

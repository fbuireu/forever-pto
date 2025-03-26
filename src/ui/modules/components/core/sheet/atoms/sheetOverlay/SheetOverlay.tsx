import * as SheetPrimitive from '@radix-ui/react-dialog';
import { mergeClasses } from '@ui/utils/mergeClasses';
import type { ComponentProps } from 'react';

export const SheetOverlay = ({ className, ...props }: ComponentProps<typeof SheetPrimitive.Overlay>) => (
    <SheetPrimitive.Overlay
        data-slot="sheet-overlay"
        className={mergeClasses(
            'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/80',
            className,
        )}
        {...props}
    />
);

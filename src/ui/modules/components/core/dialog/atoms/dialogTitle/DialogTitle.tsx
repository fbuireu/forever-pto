import * as DialogPrimitive from '@radix-ui/react-dialog';
import { mergeClasses } from '@ui/utils/mergeClasses';
import { type ComponentPropsWithoutRef, type ComponentRef, forwardRef } from 'react';

export const DialogTitle = forwardRef<
    ComponentRef<typeof DialogPrimitive.Title>,
    ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
    <DialogPrimitive.Title
        ref={ref}
        className={mergeClasses('text-lg font-semibold leading-none tracking-tight', className)}
        {...props}
    />
));

DialogTitle.displayName = DialogPrimitive.Title.displayName;

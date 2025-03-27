import * as AccordionPrimitive from '@radix-ui/react-accordion';
import { mergeClasses } from '@ui/utils/mergeClasses';
import { type ComponentPropsWithoutRef, type ComponentRef, forwardRef } from 'react';

export const AccordionContent = forwardRef<
    ComponentRef<typeof AccordionPrimitive.Content>,
    ComponentPropsWithoutRef<typeof AccordionPrimitive.Content>
>(({ className, children, ...props }, ref) => (
    <AccordionPrimitive.Content
        ref={ref}
        className="overflow-hidden text-sm data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down"
        {...props}
    >
      <div className={mergeClasses('pb-4 pt-0', className)}>{children}</div>
    </AccordionPrimitive.Content>
));

AccordionContent.displayName = AccordionPrimitive.Content.displayName;

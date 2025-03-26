import * as SelectPrimitive from '@radix-ui/react-select';
import { mergeClasses } from '@ui/utils/mergeClasses';
import { ChevronDown } from 'lucide-react';
import { type ComponentPropsWithoutRef, type ComponentRef, forwardRef } from 'react';

export const SelectScrollDownButton = forwardRef<
    ComponentRef<typeof SelectPrimitive.ScrollDownButton>,
    ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollDownButton>
>(({ className, ...props }, ref) => (
    <SelectPrimitive.ScrollDownButton
        ref={ref}
        className={mergeClasses('flex cursor-default items-center justify-center py-1', className)}
        {...props}
    >
      <ChevronDown className="h-4 w-4" />
    </SelectPrimitive.ScrollDownButton>
));

SelectScrollDownButton.displayName = SelectPrimitive.ScrollDownButton.displayName;

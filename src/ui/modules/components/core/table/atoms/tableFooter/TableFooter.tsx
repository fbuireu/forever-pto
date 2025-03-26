import { mergeClasses } from '@ui/utils/mergeClasses';
import { forwardRef, type HTMLAttributes } from 'react';

export const TableFooter = forwardRef<HTMLTableSectionElement, HTMLAttributes<HTMLTableSectionElement>>(
    ({ className, ...props }, ref) => (
        <tfoot
            ref={ref}
            className={mergeClasses('border-t bg-muted/50 font-medium last:[&>tr]:border-b-0', className)}
            {...props}
        />
    ),
);

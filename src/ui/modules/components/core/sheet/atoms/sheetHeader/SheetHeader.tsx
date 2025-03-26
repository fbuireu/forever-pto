import { mergeClasses } from '@ui/utils/mergeClasses';
import type { ComponentProps } from 'react';

export const SheetHeader = ({ className, ...props }: ComponentProps<'div'>) => (
    <div data-slot="sheet-header" className={mergeClasses('flex flex-col gap-1.5 p-4', className)} {...props} />
);

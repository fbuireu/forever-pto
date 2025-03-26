import { mergeClasses } from '@ui/utils/mergeClasses';
import type { ComponentProps } from 'react';

const SheetFooter = ({ className, ...props }: ComponentProps<'div'>) => (
    <div data-slot="sheet-footer" className={mergeClasses('mt-auto flex flex-col gap-2 p-4', className)} {...props} />
);

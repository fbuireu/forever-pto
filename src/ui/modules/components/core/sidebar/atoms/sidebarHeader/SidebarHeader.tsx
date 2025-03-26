import { mergeClasses } from '@ui/utils/mergeClasses';
import type { ComponentProps } from 'react';

export const SidebarHeader = ({ className, ...props }: ComponentProps<'div'>) => (
    <div
        data-slot="sidebar-header"
        data-sidebar="header"
        className={mergeClasses('flex flex-col gap-2 p-2', className)}
        {...props}
    />
);

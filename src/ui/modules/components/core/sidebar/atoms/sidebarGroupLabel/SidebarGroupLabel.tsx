import { Slot } from '@radix-ui/react-slot';
import { mergeClasses } from '@ui/utils/mergeClasses';
import type { ComponentProps } from 'react';

export const SidebarGroupLabel = ({
  className,
  asChild = false,
  ...props
}: ComponentProps<'div'> & { asChild?: boolean }) => {
  const Comp = asChild ? Slot : 'div';

  return (
      <Comp
          data-slot="sidebar-group-label"
          data-sidebar="group-label"
          className={mergeClasses(
              'text-sidebar-foreground/70 ring-sidebar-ring flex h-8 shrink-0 items-center rounded-md px-2 text-xs font-medium outline-hidden transition-[margin,opacity] duration-200 ease-linear focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0',
              'group-data-[collapsible=icon]:-mt-8 group-data-[collapsible=icon]:opacity-0',
              className,
          )}
          {...props}
      />
  );
};

'use client';

import { sidebarMenuButtonVariants } from '@modules/components/core/sidebar/atoms/sidebarMenuButton/config';
import { useSidebar } from '@modules/components/core/sidebar/hooks/useSidebar/useSidebar';
import { Tooltip } from '@modules/components/core/tooltip/Tooltip';
import { TooltipContent } from '@modules/components/core/tooltip/atoms/tooltipContent/TooltipContent';
import { TooltipTrigger } from '@modules/components/core/tooltip/atoms/tooltipTrigger/TooltipTrigger';
import { Slot } from '@radix-ui/react-slot';
import { mergeClasses } from '@ui/utils/mergeClasses';
import type { VariantProps } from 'class-variance-authority';
import type { ComponentProps } from 'react';

export const SidebarMenuButton = ({
  asChild = false,
  isActive = false,
  variant = 'default',
  size = 'default',
  tooltip,
  className,
  children,
  ...props
}: ComponentProps<'button'> & {
  asChild?: boolean;
  isActive?: boolean;
  tooltip?: string | ComponentProps<typeof TooltipContent>;
} & VariantProps<typeof sidebarMenuButtonVariants>) => {
  const Comp = asChild ? Slot : 'button';
  const { isMobile, state } = useSidebar();

  const button = (
      <Comp
          data-slot="sidebar-menu-button"
          data-sidebar="menu-button"
          data-size={size}
          data-active={isActive}
          className={mergeClasses(sidebarMenuButtonVariants({ variant, size }), className)}
          {...props}
      >
        {children}
      </Comp>
  );

  if (!tooltip) {
    return button;
  }

  if (typeof tooltip === 'string') {
    tooltip = {
      children: tooltip,
    };
  }

  return (
      <Tooltip>
        <TooltipTrigger asChild>{button}</TooltipTrigger>
        <TooltipContent side="right" align="center" hidden={state !== 'collapsed' || isMobile} {...tooltip} />
      </Tooltip>
  );
};

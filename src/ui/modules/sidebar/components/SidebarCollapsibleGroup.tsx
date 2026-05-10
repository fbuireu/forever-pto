'use client';

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@ui/modules/core/animate/base/Collapsible';
import { useSidebar } from '@ui/modules/core/animate/base/Sidebar';
import { type ReactNode, useState } from 'react';

interface SidebarCollapsibleGroupProps {
  defaultOpen?: boolean;
  trigger: ReactNode;
  children: ReactNode;
  'data-tutorial'?: string;
}

export function SidebarCollapsibleGroup({
  defaultOpen = false,
  trigger,
  children,
  'data-tutorial': dataTutorial,
}: SidebarCollapsibleGroupProps) {
  const { state } = useSidebar();
  const [open, setOpen] = useState(defaultOpen);

  return (
    <Collapsible
      open={state === 'collapsed' ? false : open}
      onOpenChange={setOpen}
      className='group/collapsible w-[--radix-popper-anchor-width]'
      data-tutorial={dataTutorial}
    >
      <CollapsibleTrigger asChild className='cursor-pointer w-full'>
        {trigger}
      </CollapsibleTrigger>
      <CollapsibleContent>{children}</CollapsibleContent>
    </Collapsible>
  );
}

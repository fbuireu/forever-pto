'use client';

import { SidebarFooter, SidebarMenu, SidebarMenuItem, useSidebar } from '@ui/components/animate/base/sidebar';
import { cn } from '@ui/lib/utils';
import { LanguageSelector } from './LanguageSelector';
import { ThemeSelector } from './ThemeSelector';

export const SidebarFooterButtons = () => {
  const { state } = useSidebar();
  const sidebarCollapsed = state === 'collapsed';
  return (
    <SidebarFooter className='group-data-[collapsible=icon]:px-0'>
      <SidebarMenu className={cn('gap-2', sidebarCollapsed ? 'flex-col' : 'flex-row items-center')}>
        <SidebarMenuItem className={cn(sidebarCollapsed ? 'w-full' : 'grow')}>
          <LanguageSelector />
        </SidebarMenuItem>
        <SidebarMenuItem className={cn(sidebarCollapsed ? 'w-full' : 'min-w-12')}>
          <ThemeSelector />
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarFooter>
  );
};

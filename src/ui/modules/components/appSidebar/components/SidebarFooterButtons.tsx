'use client';

import { cn } from '@const/lib/utils';
import { SidebarFooter, SidebarMenu, SidebarMenuItem, useSidebar } from 'src/components/animate-ui/base/sidebar';
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

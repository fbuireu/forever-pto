'use client';

import { cn } from '@const/lib/utils';
import { SidebarFooter, SidebarMenu, SidebarMenuItem, useSidebar } from 'src/components/animate-ui/radix/sidebar';
import { LanguageSelector } from './LanguageSelector';
import { ThemeSelector } from './ThemeSelector';

export const SidebarFooterButtons = () => {
  const { state } = useSidebar();
  const sidebarCollapsed = state === 'collapsed';
  return (
    <SidebarFooter>
      <SidebarMenu className={cn('gap-2', sidebarCollapsed ? 'flex-col' : 'flex-row items-center')}>
        <SidebarMenuItem
          className={cn(
            'transition-[width,flex-grow] duration-300 ease-in-out',
            sidebarCollapsed ? 'w-full' : 'flex-grow'
          )}
        >
          <LanguageSelector />
        </SidebarMenuItem>
        <SidebarMenuItem className={cn(sidebarCollapsed ? 'w-full' : 'min-w-[48px]')}>
          <ThemeSelector />
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarFooter>
  );
};

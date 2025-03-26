import type { SearchParams } from '@const/types';
import { FiltersPanel } from '@modules/components/appSidebar/components/appSidebar/atoms/filtersPanel/FiltersPanel';
import {
	useSidebarItems,
} from '@modules/components/appSidebar/components/appSidebar/atoms/filtersPanel/atoms/settingsItem/hooks/useSidebarItems/useSidebarItems';
import { SidebarLogo } from '@modules/components/appSidebar/components/appSidebar/atoms/sidebarLogo/SidebarLogo';
import { ThemeToggle } from '@ui/modules/components/appSidebar/components/appSidebar/atoms/themeToggle/ThemeToggle';
import { Sidebar } from '@ui/modules/components/core/sidebar/Sidebar';
import { memo } from 'react';
import { SidebarHeader } from '@modules/components/core/sidebar/atoms/sidebarHeader/SidebarHeader';
import { SidebarMenu } from '@modules/components/core/sidebar/atoms/sidebarMenu/SidebarMenu';
import { SidebarMenuItem } from '@modules/components/core/sidebar/atoms/sidebarMenuItem/SidebarMenuItem';
import { SidebarMenuButton } from '@modules/components/core/sidebar/atoms/sidebarMenuButton/SidebarMenuButton';
import { SidebarContent } from '@modules/components/core/sidebar/atoms/sidebarContent/SidebarContent';
import { SidebarGroup } from '@modules/components/core/sidebar/atoms/sidebarGroup/SidebarGroup';
import { SidebarFooter } from '@modules/components/core/sidebar/atoms/sidebarFooter/SidebarFooter';

export const AppSidebar = memo((params: SearchParams) => {
  const sidebarItems = useSidebarItems(params);

  return (
      <Sidebar collapsible="icon" variant="sidebar">
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              >
                <SidebarLogo />
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarMenu>
              <FiltersPanel items={sidebarItems} />
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <ThemeToggle />
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
  );
});

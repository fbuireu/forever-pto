import {
	MenuItemContent,
} from '@modules/components/appSidebar/components/appSidebar/atoms/filtersPanel/atoms/settingsItem/atoms/settingItem/atoms/menuItemContent/MenuItemContent';
import type { SidebarItem } from '@modules/components/appSidebar/components/appSidebar/atoms/filtersPanel/types';
import { memo } from 'react';
import { SidebarGroupContent } from '@modules/components/core/sidebar/atoms/sidebarGroupContent/SidebarGroupContent';
import { SidebarMenuItem } from '@modules/components/core/sidebar/atoms/sidebarMenuItem/SidebarMenuItem';
import { SidebarMenuButton } from '@modules/components/core/sidebar/atoms/sidebarMenuButton/SidebarMenuButton';

interface SettingItemProps {
  item: SidebarItem;
}

export const SettingItem = memo(({ item }: SettingItemProps) => (
    <SidebarGroupContent className="mb-2">
      <SidebarMenuItem>
        <div className={'flex flex-row-reverse items-baseline'}>
          {item.renderTooltip?.()}
          <SidebarMenuButton asChild tooltip={item.title} className="p-0">
            <MenuItemContent icon={item.icon} title={item.title} />
          </SidebarMenuButton>
        </div>
        {item.renderComponent()}
      </SidebarMenuItem>
    </SidebarGroupContent>
));

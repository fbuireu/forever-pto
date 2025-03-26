import { SettingsItems } from "@modules/components/appSidebar/components/appSidebar/atoms/filtersPanel/atoms/settingsItem/SettingsItem";
import type { SidebarItem } from "@modules/components/appSidebar/components/appSidebar/atoms/filtersPanel/types";
import { GearSettings } from "@modules/components/appSidebar/components/appSidebar/atoms/gearSettings/GearSettings";
import { SidebarMenuItem } from "@modules/components/core/sidebar/atoms/sidebarMenuItem/SidebarMenuItem";
import { SidebarMenuSub } from "@modules/components/core/sidebar/atoms/sidebarMenuSub/SidebarMenuSub";
import { SidebarMenuSubItem } from "@modules/components/core/sidebar/atoms/sidebarMenuSubItem/SidebarMenuSubItem";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@radix-ui/react-collapsible";
import { memo } from "react";

export const FiltersPanel = memo(({ items }: { items: SidebarItem[] }) => (
	<Collapsible defaultOpen className="group/collapsible w-[--radix-popper-anchor-width]">
		<SidebarMenuItem>
			<CollapsibleTrigger asChild>
				<GearSettings />
			</CollapsibleTrigger>
			<CollapsibleContent>
				<SidebarMenuSub>
					<SidebarMenuSubItem />
					<SettingsItems items={items} />
				</SidebarMenuSub>
			</CollapsibleContent>
		</SidebarMenuItem>
	</Collapsible>
));

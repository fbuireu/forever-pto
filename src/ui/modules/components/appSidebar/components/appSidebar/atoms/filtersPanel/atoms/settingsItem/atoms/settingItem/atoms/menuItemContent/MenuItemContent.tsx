import type { SidebarItem } from "@modules/components/appSidebar/components/appSidebar/atoms/filtersPanel/types";
import { memo } from "react";

interface MenuItemContentProps {
	icon: SidebarItem["icon"];
	title: SidebarItem["title"];
}

export const MenuItemContent = memo(({ icon: Icon, title }: MenuItemContentProps) => (
	<div>
		<Icon />
		<span>{title}</span>
	</div>
));

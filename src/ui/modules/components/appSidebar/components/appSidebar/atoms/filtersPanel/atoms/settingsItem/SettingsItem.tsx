import { SettingItem } from "@modules/components/appSidebar/components/appSidebar/atoms/filtersPanel/atoms/settingsItem/atoms/settingItem/SettingItem";
import type { SidebarItem } from "@modules/components/appSidebar/components/appSidebar/atoms/filtersPanel/types";
import { memo } from "react";

interface SettingsItemsProps {
	items: SidebarItem[];
}

export const SettingsItems = memo(({ items }: SettingsItemsProps) => (
	<>
		{items.map((item) => (
			<SettingItem key={item.id} item={item} />
		))}
	</>
));

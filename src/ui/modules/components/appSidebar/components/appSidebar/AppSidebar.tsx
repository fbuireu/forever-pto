"use client";

import { useSidebarItems } from "@modules/components/appSidebar/components/appSidebar/atoms/filtersPanel/atoms/settingsItem/hooks/useSidebarItems/useSidebarItems";
import { FiltersPanel } from "@modules/components/appSidebar/components/appSidebar/atoms/filtersPanel/FiltersPanel";
import { LanguageSelector } from "@modules/components/appSidebar/components/appSidebar/atoms/languageSelector/LanguageSelector";
import { SidebarLogo } from "@modules/components/appSidebar/components/appSidebar/atoms/sidebarLogo/SidebarLogo";
import { SidebarContent } from "@modules/components/core/sidebar/atoms/sidebarContent/SidebarContent";
import { SidebarFooter } from "@modules/components/core/sidebar/atoms/sidebarFooter/SidebarFooter";
import { SidebarGroup } from "@modules/components/core/sidebar/atoms/sidebarGroup/SidebarGroup";
import { SidebarHeader } from "@modules/components/core/sidebar/atoms/sidebarHeader/SidebarHeader";
import { SidebarMenu } from "@modules/components/core/sidebar/atoms/sidebarMenu/SidebarMenu";
import { SidebarMenuButton } from "@modules/components/core/sidebar/atoms/sidebarMenuButton/SidebarMenuButton";
import { SidebarMenuItem } from "@modules/components/core/sidebar/atoms/sidebarMenuItem/SidebarMenuItem";
import { ThemeToggle } from "@ui/modules/components/appSidebar/components/appSidebar/atoms/themeToggle/ThemeToggle";
import { Sidebar } from "@ui/modules/components/core/sidebar/Sidebar";
import type { Locale } from "next-intl";
import { memo } from "react";

interface AppSidebarProps {
	locale: Locale;
}

export const AppSidebar = memo(({ locale }: AppSidebarProps) => {
	const sidebarItems = useSidebarItems({ locale });

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
						<LanguageSelector />
					</SidebarMenuItem>
					<SidebarMenuItem>
						<ThemeToggle />
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarFooter>
		</Sidebar>
	);
});

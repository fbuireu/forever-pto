import type { SearchParams } from '@app/page';

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@radix-ui/react-collapsible';
import { Calendar, CalendarDays, type LucideIcon, MapPin, MapPinned, ToggleLeftIcon } from 'lucide-react';
import type React from 'react';
import { PtoDaysInput } from '@modules/components/sidebar/atoms/PtoDaysInput';
import CountryCombobox from '@modules/components/sidebar/atoms/CountryCombobox';
import RegionCombobox from '@modules/components/sidebar/atoms/RegionCombobox';
import { YearSelect } from '@modules/components/sidebar/atoms/YearSelect';
import { GearSettings } from '@modules/components/sidebar/atoms/GearSettings';
import { ThemeToggle } from '@modules/components/sidebar/atoms/ThemeToggle';
import {
	Sidebar,
			SidebarContent,
			SidebarFooter,
			SidebarGroup,
			SidebarGroupContent,
			SidebarHeader,
			SidebarMenu,
			SidebarMenuButton,
			SidebarMenuItem,
			SidebarMenuSub,
			SidebarMenuSubItem,
}  from '@modules/components/core/Sidebar';

type AppSidebarProps = SearchParams;

type MenuItem = {
	title: string;
	icon: LucideIcon;
	renderComponent?: () => React.ReactNode;
};

export function AppSidebar({ country, region, ptoDays, year, allowPastDays }: AppSidebarProps) {
	const items: MenuItem[] = [
		{
			title: "PTO days",
			icon: CalendarDays,
			renderComponent: () => <PtoDaysInput ptoDays={ptoDays} />,
		},
		{
			title: "Country",
			icon: MapPin,
			renderComponent: () => <CountryCombobox country={country} />,
		},
		{
			title: "Region",
			icon: MapPinned,
			renderComponent: () => <RegionCombobox country={country} region={region} />,
		},
		{
			title: "Year",
			icon: Calendar,
			renderComponent: () => <YearSelect year={year} />,
		},
		{
			title: "Allow Past Days",
			icon: ToggleLeftIcon,
			// renderComponent: () => <SwitchInput name="allowPastDays" checked={allowPastDays} />
		},
	];

	return (
		<Sidebar collapsible="icon" variant="sidebar">
			<SidebarHeader>
				<SidebarMenu>
					<SidebarMenuItem>
						<SidebarMenuButton
							size="lg"
							className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
						>
							<div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground w-full">
								Logo
							</div>
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarHeader>
			<SidebarContent>
				<SidebarGroup>
					<SidebarMenu>
						<Collapsible defaultOpen className="group/collapsible w-[--radix-popper-anchor-width]">
							<SidebarMenuItem>
								<CollapsibleTrigger asChild>
									<GearSettings />
								</CollapsibleTrigger>
								<CollapsibleContent>
									<SidebarMenuSub>
										<SidebarMenuSubItem />
										{items.map((item) => (
											<SidebarGroupContent key={item.title} className="mb-2">
												<SidebarMenuItem>
													<SidebarMenuButton asChild tooltip={item.title} className="p-0">
														<div>
															<item.icon />
															<span>{item.title}</span>
														</div>
													</SidebarMenuButton>
													{item.renderComponent && <>{item.renderComponent()}</>}
												</SidebarMenuItem>
											</SidebarGroupContent>
										))}
									</SidebarMenuSub>
								</CollapsibleContent>
							</SidebarMenuItem>
						</Collapsible>
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
}

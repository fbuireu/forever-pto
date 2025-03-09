import type { SearchParams } from '@/app/page';
import CountryCombobox from '@/components/ui/CountryCombobox';
import { GearSettings } from '@/components/ui/GearSettings';
import { PtoDaysInput } from '@/components/ui/PtoDaysInput';
import RegionCombobox from '@/components/ui/RegionCombobox';
import { YearSelect } from '@/components/ui/YearSelect';
import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubItem,
} from '@/components/ui/sidebar';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@radix-ui/react-collapsible';
import type { LucideIcon } from 'lucide-react';
import { Calendar, CalendarDays, MapPin, MapPinned, ToggleLeftIcon } from 'lucide-react';
import type React from 'react';

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
											<SidebarGroupContent key={item.title}>
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
		</Sidebar>
	);
}

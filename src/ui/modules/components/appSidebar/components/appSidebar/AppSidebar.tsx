import type { SearchParams } from '@const/types';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@radix-ui/react-collapsible';
import { AllowPastDays } from '@ui/modules/components/appSidebar/components/appSidebar/atoms/AllowPastDays';
import Countries from '@ui/modules/components/appSidebar/components/appSidebar/atoms/Countries';
import { GearSettings } from '@ui/modules/components/appSidebar/components/appSidebar/atoms/GearSettings';
import { PtoDays } from '@ui/modules/components/appSidebar/components/appSidebar/atoms/PtoDays';
import Regions from '@ui/modules/components/appSidebar/components/appSidebar/atoms/Regions';
import { ThemeToggle } from '@ui/modules/components/appSidebar/components/appSidebar/atoms/ThemeToggle';
import { Years } from '@ui/modules/components/appSidebar/components/appSidebar/atoms/Years';
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
} from '@ui/modules/components/core/sidebar/Sidebar';
import { Calendar, CalendarDays, type LucideIcon, MapPin, MapPinned, ToggleLeftIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { CarryOverMonths } from './atoms/CarryOverMonths';

type AppSidebarProps = SearchParams;

type MenuItem = {
	title: string;
	icon: LucideIcon;
	renderComponent?: () => ReactNode;
};

export function AppSidebar({ country, region, ptoDays, year, allowPastDays, carryOverMonths }: AppSidebarProps) {
	const items: MenuItem[] = [
		{
			title: "PTO days",
			icon: CalendarDays,
			renderComponent: () => <PtoDays ptoDays={ptoDays} />,
		},
		{
			title: "Country",
			icon: MapPin,
			renderComponent: () => <Countries country={country} />,
		},
		{
			title: "Region",
			icon: MapPinned,
			renderComponent: () => <Regions country={country} region={region} />,
		},
		{
			title: "Year",
			icon: Calendar,
			renderComponent: () => <Years year={year} />,
		},
		{
			title: "Allow Past Days",
			icon: ToggleLeftIcon,
			renderComponent: () => <AllowPastDays allowPastDays={allowPastDays} />,
		},
		{
			title: "Months to Show",
			icon: ToggleLeftIcon,
			renderComponent: () => <CarryOverMonths carryOverMonths={carryOverMonths} />,
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

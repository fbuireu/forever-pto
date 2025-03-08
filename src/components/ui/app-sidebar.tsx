import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { Calendar, CalendarDays, MapPin, MapPinned, ToggleLeftIcon } from 'lucide-react';

const items = [
	{
		title: "PTO days",
		icon: CalendarDays,
	},
	{
		title: "Country",
		icon: MapPin,
	},
	{
		title: "Region",
		icon: MapPinned,
	},
	{
		title: "Year",
		icon: Calendar,
	},
	{
		title: "Allow Past Days",
		icon: ToggleLeftIcon,
	},
];

export function AppSidebar() {
	return (
		<Sidebar collapsible="icon" variant="sidebar">
			<SidebarContent>
				<SidebarGroup>
					<SidebarGroupLabel>Forever PTO</SidebarGroupLabel>
					<SidebarMenu>
						{items.map((item) => (
							<SidebarGroupContent key={item.title}>
								<SidebarMenuItem>
									<SidebarMenuButton asChild>
										<a href={item.title}>
											<item.icon />
											<span>{item.title}</span>
										</a>
									</SidebarMenuButton>
								</SidebarMenuItem>
							</SidebarGroupContent>
						))}
					</SidebarMenu>
				</SidebarGroup>
			</SidebarContent>
		</Sidebar>
	);
}

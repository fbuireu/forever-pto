import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export interface SidebarItem {
	id: string;
	title: string;
	icon: LucideIcon;
	renderComponent: () => ReactNode;
	renderTooltip?: () => ReactNode;
}

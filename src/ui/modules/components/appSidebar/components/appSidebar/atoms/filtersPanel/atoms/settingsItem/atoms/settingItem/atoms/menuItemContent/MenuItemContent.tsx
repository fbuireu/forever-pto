import type { LucideIcon } from "lucide-react";
import { memo } from "react";

interface MenuItemContentProps {
	icon: LucideIcon;
	title: string;
}

export const MenuItemContent = memo(({ icon: Icon, title }: MenuItemContentProps) => (
	<div className="flex items-center gap-2 p-2">
		<Icon className="h-4 w-4" />
		<span>{title}</span>
	</div>
));

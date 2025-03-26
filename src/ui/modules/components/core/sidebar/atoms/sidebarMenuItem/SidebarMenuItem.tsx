import { mergeClasses } from "@ui/utils/mergeClasses";
import type { ComponentProps } from "react";

export const SidebarMenuItem = ({ className, ...props }: ComponentProps<"li">) => (
	<li
		data-slot="sidebar-menu-item"
		data-sidebar="menu-item"
		className={mergeClasses("group/menu-item relative", className)}
		{...props}
	/>
);

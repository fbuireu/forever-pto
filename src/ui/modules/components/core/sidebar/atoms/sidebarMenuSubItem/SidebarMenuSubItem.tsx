import { mergeClasses } from "@ui/utils/mergeClasses/mergeClasses";
import type { ComponentProps } from "react";

export const SidebarMenuSubItem = ({ className, ...props }: ComponentProps<"li">) => (
	<li
		data-slot="sidebar-menu-sub-item"
		data-sidebar="menu-sub-item"
		className={mergeClasses("group/menu-sub-item relative", className)}
		{...props}
	/>
);

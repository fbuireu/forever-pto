import { mergeClasses } from "@ui/utils/mergeClasses";
import type { ComponentProps } from "react";

export const SidebarMenuSub = ({ className, ...props }: ComponentProps<"ul">) => (
	<ul
		data-slot="sidebar-menu-sub"
		data-sidebar="menu-sub"
		className={mergeClasses(
			"border-sidebar-border mx-3.5 flex min-w-0 translate-x-px flex-col gap-1 border-l px-2.5 py-0.5",
			"group-data-[collapsible=icon]:hidden",
			className,
		)}
		{...props}
	/>
);

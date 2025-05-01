import { mergeClasses } from "@ui/utils/mergeClasses";
import type { ComponentProps } from "react";

export const SidebarContent = ({ className, ...props }: ComponentProps<"div">) => (
	<div
		data-slot="sidebar-content"
		data-sidebar="content"
		className={mergeClasses(
			"flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto overflow-x-hidden group-data-[collapsible=icon]:overflow-hidden",
			className,
		)}
		{...props}
	/>
);

import { mergeClasses } from "@ui/utils/mergeClasses";
import type { ComponentProps } from "react";

export const SidebarGroup = ({ className, ...props }: ComponentProps<"div">) => (
	<div
		data-slot="sidebar-group"
		data-sidebar="group"
		className={mergeClasses("relative flex w-full min-w-0 flex-col p-2", className)}
		{...props}
	/>
);

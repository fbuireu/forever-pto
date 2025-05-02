import { mergeClasses } from "@ui/utils/mergeClasses/mergeClasses";
import type { ComponentProps } from "react";

export const SidebarGroupContent = ({ className, ...props }: ComponentProps<"div">) => (
	<div
		data-slot="sidebar-group-content"
		data-sidebar="group-content"
		className={mergeClasses("w-full text-sm", className)}
		{...props}
	/>
);

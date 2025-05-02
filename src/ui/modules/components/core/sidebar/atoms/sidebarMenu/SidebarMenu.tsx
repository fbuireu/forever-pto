import { mergeClasses } from "@ui/utils/mergeClasses/mergeClasses";
import type { ComponentProps } from "react";

export const SidebarMenu = ({ className, ...props }: ComponentProps<"ul">) => (
	<ul
		data-slot="sidebar-menu"
		data-sidebar="menu"
		className={mergeClasses("flex w-full min-w-0 flex-col gap-1", className)}
		{...props}
	/>
);

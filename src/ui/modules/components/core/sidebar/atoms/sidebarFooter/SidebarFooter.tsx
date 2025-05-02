import { mergeClasses } from "@ui/utils/mergeClasses/mergeClasses";
import type { ComponentProps } from "react";

export const SidebarFooter = ({ className, ...props }: ComponentProps<"div">) => (
	<div
		data-slot="sidebar-footer"
		data-sidebar="footer"
		className={mergeClasses("flex flex-col gap-2 p-2", className)}
		{...props}
	/>
);

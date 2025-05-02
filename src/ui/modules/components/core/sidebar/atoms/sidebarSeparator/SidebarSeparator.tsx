import { Separator } from "@radix-ui/react-menu";
import { mergeClasses } from "@ui/utils/mergeClasses/mergeClasses";
import type { ComponentProps } from "react";

export const SidebarSeparator = ({ className, ...props }: ComponentProps<typeof Separator>) => (
	<Separator
		data-slot="sidebar-separator"
		data-sidebar="separator"
		className={mergeClasses("bg-sidebar-border mx-2 w-auto", className)}
		{...props}
	/>
);

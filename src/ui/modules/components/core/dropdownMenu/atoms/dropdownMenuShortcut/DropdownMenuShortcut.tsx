import { mergeClasses } from "@ui/utils/mergeClasses/mergeClasses";
import type { ComponentProps } from "react";

export const DropdownMenuShortcut = ({ className, ...props }: ComponentProps<"span">) => (
	<span
		data-slot="dropdown-menu-shortcut"
		className={mergeClasses("text-muted-foreground ml-auto text-xs tracking-widest", className)}
		{...props}
	/>
);

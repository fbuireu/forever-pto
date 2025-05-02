import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { mergeClasses } from "@ui/utils/mergeClasses/mergeClasses";
import type { ComponentProps } from "react";

export const DropdownMenuSeparator = ({
	className,
	...props
}: ComponentProps<typeof DropdownMenuPrimitive.Separator>) => (
	<DropdownMenuPrimitive.Separator
		data-slot="dropdown-menu-separator"
		className={mergeClasses("bg-border -mx-1 my-1 h-px", className)}
		{...props}
	/>
);

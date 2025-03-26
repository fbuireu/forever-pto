import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import type { ComponentProps } from "react";

export const DropdownMenuGroup = ({ ...props }: ComponentProps<typeof DropdownMenuPrimitive.Group>) => (
	<DropdownMenuPrimitive.Group data-slot="dropdown-menu-group" {...props} />
);

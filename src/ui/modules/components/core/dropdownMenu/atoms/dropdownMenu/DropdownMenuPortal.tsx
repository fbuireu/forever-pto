import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import type { ComponentProps } from "react";

export const DropdownMenuPortal = ({ ...props }: ComponentProps<typeof DropdownMenuPrimitive.Portal>) => (
	<DropdownMenuPrimitive.Portal data-slot="dropdown-menu-portal" {...props} />
);

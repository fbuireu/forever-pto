import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import type { ComponentProps } from "react";

export const DropdownMenuSub = ({ ...props }: ComponentProps<typeof DropdownMenuPrimitive.Sub>) => (
	<DropdownMenuPrimitive.Sub data-slot="dropdown-menu-sub" {...props} />
);

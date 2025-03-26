import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import type { ComponentProps } from "react";

export const DropdownMenuTrigger = ({ ...props }: ComponentProps<typeof DropdownMenuPrimitive.Trigger>) => (
	<DropdownMenuPrimitive.Trigger data-slot="dropdown-menu-trigger" {...props} />
);

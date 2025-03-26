"use client";

import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import type { ComponentProps } from "react";

export const DropdownMenu = ({ ...props }: ComponentProps<typeof DropdownMenuPrimitive.Root>) => (
	<DropdownMenuPrimitive.Root data-slot="dropdown-menu" {...props} />
);

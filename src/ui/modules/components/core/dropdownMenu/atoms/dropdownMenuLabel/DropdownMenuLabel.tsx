import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { mergeClasses } from "@ui/utils/mergeClasses/mergeClasses";
import type { ComponentProps } from "react";

export const DropdownMenuLabel = ({
	className,
	inset,
	...props
}: ComponentProps<typeof DropdownMenuPrimitive.Label> & {
	inset?: boolean;
}) => (
	<DropdownMenuPrimitive.Label
		data-slot="dropdown-menu-label"
		data-inset={inset}
		className={mergeClasses("px-2 py-1.5 text-sm font-medium data-[inset]:pl-8", className)}
		{...props}
	/>
);

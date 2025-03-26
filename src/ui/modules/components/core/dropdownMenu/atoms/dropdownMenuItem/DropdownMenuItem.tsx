import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { mergeClasses } from "@ui/utils/mergeClasses";
import type { ComponentProps } from "react";

export const DropdownMenuItem = ({
	className,
	inset,
	variant = "default",
	...props
}: ComponentProps<typeof DropdownMenuPrimitive.Item> & {
	inset?: boolean;
	variant?: "default" | "destructive";
}) => (
	<DropdownMenuPrimitive.Item
		data-slot="dropdown-menu-item"
		data-inset={inset}
		data-variant={variant}
		className={mergeClasses(
			"focus:bg-accent focus:text-accent-foreground data-[variant=destructive]:text-destructive-foreground data-[variant=destructive]:focus:bg-destructive/10 dark:data-[variant=destructive]:focus:bg-destructive/40 data-[variant=destructive]:focus:text-destructive-foreground data-[variant=destructive]:*:[svg]:!text-destructive-foreground [&_svg:not([class*='text-'])]:text-muted-foreground relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[inset]:pl-8 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
			className,
		)}
		{...props}
	/>
);

import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { mergeClasses } from "@ui/utils/mergeClasses";
import { ChevronRightIcon } from "lucide-react";
import type { ComponentProps } from "react";

export const DropdownMenuSubTrigger = ({
	className,
	inset,
	children,
	...props
}: ComponentProps<typeof DropdownMenuPrimitive.SubTrigger> & {
	inset?: boolean;
}) => (
	<DropdownMenuPrimitive.SubTrigger
		data-slot="dropdown-menu-sub-trigger"
		data-inset={inset}
		className={mergeClasses(
			"focus:bg-accent focus:text-accent-foreground data-[state=open]:bg-accent data-[state=open]:text-accent-foreground flex cursor-default items-center rounded-sm px-2 py-1.5 text-sm outline-hidden select-none data-[inset]:pl-8",
			className,
		)}
		{...props}
	>
		{children}
		<ChevronRightIcon className="ml-auto size-4" />
	</DropdownMenuPrimitive.SubTrigger>
);

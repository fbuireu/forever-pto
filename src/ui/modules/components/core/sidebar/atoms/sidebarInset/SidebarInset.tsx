import { mergeClasses } from "@ui/utils/mergeClasses/mergeClasses";
import type { ComponentProps } from "react";

export const SidebarInset = ({ className, ...props }: ComponentProps<"main">) => (
	<main
		data-slot="sidebar-inset"
		className={mergeClasses(
			"bg-background relative flex w-full flex-1 flex-col",
			"md:peer-data-[variant=inset]:m-2 md:peer-data-[variant=inset]:ml-0 md:peer-data-[variant=inset]:rounded-xl md:peer-data-[variant=inset]:shadow-sm md:peer-data-[variant=inset]:peer-data-[state=collapsed]:ml-2",
			className,
		)}
		{...props}
	/>
);

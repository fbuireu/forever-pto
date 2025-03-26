import { Input } from "@modules/components/core/input/Input";
import { mergeClasses } from "@ui/utils/mergeClasses";
import type { ComponentProps } from "react";

export const SidebarInput = ({ className, ...props }: ComponentProps<typeof Input>) => (
	<Input
		data-slot="sidebar-input"
		data-sidebar="input"
		className={mergeClasses("bg-background h-8 w-full shadow-none", className)}
		{...props}
	/>
);

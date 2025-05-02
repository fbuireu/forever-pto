"use client";

import { mergeClasses } from "@ui/utils/mergeClasses/mergeClasses";
import { Command as CommandPrimitive } from "cmdk";
import { type ComponentPropsWithoutRef, type ComponentRef, forwardRef } from "react";

export const Command = forwardRef<
	ComponentRef<typeof CommandPrimitive>,
	ComponentPropsWithoutRef<typeof CommandPrimitive>
>(({ className, ...props }, ref) => (
	<CommandPrimitive
		ref={ref}
		className={mergeClasses(
			"flex h-full w-full flex-col overflow-hidden rounded-md bg-popover text-popover-foreground",
			className,
		)}
		{...props}
	/>
));

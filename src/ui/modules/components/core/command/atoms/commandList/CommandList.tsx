import { mergeClasses } from "@ui/utils/mergeClasses";
import { Command as CommandPrimitive } from "cmdk";
import { type ComponentPropsWithoutRef, type ComponentRef, forwardRef } from "react";

export const CommandList = forwardRef<
	ComponentRef<typeof CommandPrimitive.List>,
	ComponentPropsWithoutRef<typeof CommandPrimitive.List>
>(({ className, ...props }, ref) => (
	<CommandPrimitive.List
		ref={ref}
		className={mergeClasses("max-h-[300px] overflow-y-auto overflow-x-hidden", className)}
		{...props}
	/>
));

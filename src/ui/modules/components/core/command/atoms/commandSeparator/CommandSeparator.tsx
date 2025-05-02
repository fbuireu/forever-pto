import { mergeClasses } from "@ui/utils/mergeClasses/mergeClasses";
import { Command as CommandPrimitive } from "cmdk";
import { type ComponentPropsWithoutRef, type ComponentRef, forwardRef } from "react";

export const CommandSeparator = forwardRef<
	ComponentRef<typeof CommandPrimitive.Separator>,
	ComponentPropsWithoutRef<typeof CommandPrimitive.Separator>
>(({ className, ...props }, ref) => (
	<CommandPrimitive.Separator ref={ref} className={mergeClasses("-mx-1 h-px bg-border", className)} {...props} />
));

CommandSeparator.displayName = CommandPrimitive.Separator.displayName;

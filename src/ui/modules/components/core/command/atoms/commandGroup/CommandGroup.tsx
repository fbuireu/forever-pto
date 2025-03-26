import { mergeClasses } from "@ui/utils/mergeClasses";
import { Command as CommandPrimitive } from "cmdk";
import { type ComponentPropsWithoutRef, type ComponentRef, forwardRef } from "react";

export const CommandGroup = forwardRef<
	ComponentRef<typeof CommandPrimitive.Group>,
	ComponentPropsWithoutRef<typeof CommandPrimitive.Group>
>(({ className, ...props }, ref) => (
	<CommandPrimitive.Group
		ref={ref}
		className={mergeClasses(
			"overflow-hidden p-1 text-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground",
			className,
		)}
		{...props}
	/>
));

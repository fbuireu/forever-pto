import * as SelectPrimitive from "@radix-ui/react-select";
import { mergeClasses } from "@ui/utils/mergeClasses/mergeClasses";
import { type ComponentPropsWithoutRef, type ComponentRef, forwardRef } from "react";

export const SelectSeparator = forwardRef<
	ComponentRef<typeof SelectPrimitive.Separator>,
	ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(({ className, ...props }, ref) => (
	<SelectPrimitive.Separator ref={ref} className={mergeClasses("-mx-1 my-1 h-px bg-muted", className)} {...props} />
));

SelectSeparator.displayName = SelectPrimitive.Separator.displayName;

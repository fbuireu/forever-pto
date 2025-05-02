import * as SelectPrimitive from "@radix-ui/react-select";
import { mergeClasses } from "@ui/utils/mergeClasses/mergeClasses";
import { type ComponentPropsWithoutRef, type ComponentRef, forwardRef } from "react";

export const SelectLabel = forwardRef<
	ComponentRef<typeof SelectPrimitive.Label>,
	ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>(({ className, ...props }, ref) => (
	<SelectPrimitive.Label
		ref={ref}
		className={mergeClasses("px-2 py-1.5 text-sm font-semibold", className)}
		{...props}
	/>
));

SelectLabel.displayName = SelectPrimitive.Label.displayName;

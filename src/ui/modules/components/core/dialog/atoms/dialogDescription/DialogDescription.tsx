import * as DialogPrimitive from "@radix-ui/react-dialog";
import { mergeClasses } from "@ui/utils/mergeClasses/mergeClasses";
import { type ComponentPropsWithoutRef, type ComponentRef, forwardRef } from "react";

export const DialogDescription = forwardRef<
	ComponentRef<typeof DialogPrimitive.Description>,
	ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
	<DialogPrimitive.Description
		ref={ref}
		className={mergeClasses("text-sm text-muted-foreground", className)}
		{...props}
	/>
));

DialogDescription.displayName = DialogPrimitive.Description.displayName;

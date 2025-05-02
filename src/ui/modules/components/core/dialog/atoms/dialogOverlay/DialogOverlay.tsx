import * as DialogPrimitive from "@radix-ui/react-dialog";
import { mergeClasses } from "@ui/utils/mergeClasses/mergeClasses";
import { type ComponentPropsWithoutRef, type ComponentRef, forwardRef } from "react";

export const DialogOverlay = forwardRef<
	ComponentRef<typeof DialogPrimitive.Overlay>,
	ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
	<DialogPrimitive.Overlay ref={ref} className={mergeClasses("fixed inset-0 z-50 bg-black/80", className)} {...props} />
));

DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

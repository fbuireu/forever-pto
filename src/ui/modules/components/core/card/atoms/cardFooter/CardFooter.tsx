import { mergeClasses } from "@ui/utils/mergeClasses/mergeClasses";
import { forwardRef, type HTMLAttributes } from "react";

export const CardFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
	<div ref={ref} className={mergeClasses("flex items-center p-6 pt-0", className)} {...props} />
));

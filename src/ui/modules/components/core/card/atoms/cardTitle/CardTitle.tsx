import { mergeClasses } from "@ui/utils/mergeClasses";
import { type HTMLAttributes, forwardRef } from "react";

export const CardTitle = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
	<div ref={ref} className={mergeClasses("font-semibold leading-none tracking-tight", className)} {...props} />
));

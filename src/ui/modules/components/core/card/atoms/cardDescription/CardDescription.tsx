import { mergeClasses } from "@ui/utils/mergeClasses/mergeClasses";
import { type HTMLAttributes, forwardRef } from "react";

export const CardDescription = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
	({ className, ...props }, ref) => (
		<div ref={ref} className={mergeClasses("text-sm text-muted-foreground", className)} {...props} />
	),
);

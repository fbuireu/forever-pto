import { mergeClasses } from "@ui/utils/mergeClasses";
import { type HTMLAttributes, forwardRef } from "react";

export const AlertTitle = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLHeadingElement>>(
	({ className, ...props }, ref) => (
		<h5 ref={ref} className={mergeClasses("mb-1 font-medium leading-none tracking-tight", className)} {...props} />
	),
);

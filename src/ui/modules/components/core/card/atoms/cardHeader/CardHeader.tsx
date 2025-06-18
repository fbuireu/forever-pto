import { mergeClasses } from "@ui/utils/mergeClasses/mergeClasses";
import { forwardRef, type HTMLAttributes } from "react";

export const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
	<div ref={ref} className={mergeClasses("flex flex-col space-y-1.5 p-6", className)} {...props} />
));

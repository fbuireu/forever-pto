import { mergeClasses } from "@ui/utils/mergeClasses/mergeClasses";
import { forwardRef, type HTMLAttributes } from "react";

export const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
	({ className, ...props }, ref) => <div ref={ref} className={mergeClasses("p-6 pt-0", className)} {...props} />,
);

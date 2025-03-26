import { mergeClasses } from "@ui/utils/mergeClasses";
import { type HTMLAttributes, forwardRef } from "react";

export const TableBody = forwardRef<HTMLTableSectionElement, HTMLAttributes<HTMLTableSectionElement>>(
	({ className, ...props }, ref) => (
		<tbody ref={ref} className={mergeClasses("[&_tr:last-child]:border-0", className)} {...props} />
	),
);

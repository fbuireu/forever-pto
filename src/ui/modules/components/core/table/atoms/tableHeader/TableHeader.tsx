import { mergeClasses } from "@ui/utils/mergeClasses/mergeClasses";
import { type HTMLAttributes, forwardRef } from "react";

export const TableHeader = forwardRef<HTMLTableSectionElement, HTMLAttributes<HTMLTableSectionElement>>(
	({ className, ...props }, ref) => (
		<thead ref={ref} className={mergeClasses("[&_tr]:border-b", className)} {...props} />
	),
);

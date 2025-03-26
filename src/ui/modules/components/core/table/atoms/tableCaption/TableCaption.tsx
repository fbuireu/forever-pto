import { mergeClasses } from "@ui/utils/mergeClasses";
import { type HTMLAttributes, forwardRef } from "react";

export const TableCaption = forwardRef<HTMLTableCaptionElement, HTMLAttributes<HTMLTableCaptionElement>>(
	({ className, ...props }, ref) => (
		<caption ref={ref} className={mergeClasses("mt-4 text-sm text-muted-foreground", className)} {...props} />
	),
);

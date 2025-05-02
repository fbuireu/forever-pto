import { mergeClasses } from "@ui/utils/mergeClasses/mergeClasses";
import { type HTMLAttributes, forwardRef } from "react";

export const TableRow = forwardRef<HTMLTableRowElement, HTMLAttributes<HTMLTableRowElement>>(
	({ className, ...props }, ref) => (
		<tr
			ref={ref}
			className={mergeClasses("border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted", className)}
			{...props}
		/>
	),
);

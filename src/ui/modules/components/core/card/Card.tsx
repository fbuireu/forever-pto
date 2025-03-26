import { mergeClasses } from "@ui/utils/mergeClasses";
import { type HTMLAttributes, forwardRef } from "react";

export const Card = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
	<div
		ref={ref}
		className={mergeClasses("rounded-xl border bg-card text-card-foreground shadow-sm", className)}
		{...props}
	/>
));

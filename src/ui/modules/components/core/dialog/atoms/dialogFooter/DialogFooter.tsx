import { mergeClasses } from "@ui/utils/mergeClasses";
import type { HTMLAttributes } from "react";

export const DialogFooter = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
	<div
		className={mergeClasses("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className)}
		{...props}
	/>
);

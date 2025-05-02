import { mergeClasses } from "@ui/utils/mergeClasses/mergeClasses";
import type { HTMLAttributes } from "react";

export const DialogHeader = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
	<div className={mergeClasses("flex flex-col space-y-1.5 text-center sm:text-left", className)} {...props} />
);

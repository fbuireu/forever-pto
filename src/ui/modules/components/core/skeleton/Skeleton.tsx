import { mergeClasses } from "@ui/utils/mergeClasses";
import type { HTMLAttributes } from "react";

export const Skeleton = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
	<div className={mergeClasses("animate-pulse rounded-md bg-primary/10", className)} {...props} />
);
